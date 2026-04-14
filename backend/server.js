const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const { RPC } = require('@ckb-lumos/lumos');
const { Indexer } = require('@ckb-lumos/ckb-indexer');

const CKB_RPC_URL = process.env.CKB_RPC_URL || 'https://testnet.ckb.dev/rpc';
const CKB_INDEXER_URL = process.env.CKB_INDEXER_URL || 'https://testnet.ckb.dev/indexer';

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

// Billboard type script hash (set after deployment)
const BILLBOARD_TYPE_CODE_HASH = process.env.BILLBOARD_TYPE_CODE_HASH || '';
const BILLBOARD_TYPE_HASH_TYPE = process.env.BILLBOARD_TYPE_HASH_TYPE || 'data2';

const STATUS_AVAILABLE = 0;
const STATUS_LEASED = 1;

function readU64(buffer, offset) {
  const buf = Buffer.from(buffer.slice(offset, offset + 8));
  return buf.readBigUInt64LE(0);
}

function readU32(buffer, offset) {
  const buf = Buffer.from(buffer.slice(offset, offset + 4));
  return buf.readUInt32LE(0);
}

function parseBillboardData(data) {
  if (!data || data.length < 34) return null;
  const buf = Buffer.from(data);
  const minPricePerBlock = readU64(buf, 0);
  const autoApprove = buf[8];
  const minLeaseBlocks = readU32(buf, 9);
  const coolDownBlocks = readU32(buf, 13);
  const createdAt = readU64(buf, 17);
  const status = buf[25];
  const totalEarned = readU64(buf, 26);
  let lease = null;
  if (status === STATUS_LEASED && buf.length > 34) {
    const advertiserLockHash = '0x' + buf.slice(34, 54).toString('hex');
    const startBlock = Number(readU64(buf, 54));
    const endBlock = Number(readU64(buf, 62));
    const pricePerBlock = Number(readU64(buf, 70));
    const totalLocked = Number(readU64(buf, 78));
    const contentOffset = 86;
    if (buf.length > contentOffset + 4) {
      const contentLen = readU32(buf, contentOffset);
      const contentStart = contentOffset + 4;
      if (buf.length >= contentStart + contentLen) {
        const contentBuf = buf.slice(contentStart, contentStart + contentLen);
        if (contentBuf.length > 0 && contentBuf[0] === 0) {
          let off = 1;
          const imageUrlLen = readU32(contentBuf, off); off += 4;
          const imageUrl = contentBuf.slice(off, off + imageUrlLen).toString('utf8'); off += imageUrlLen;
          const altTextLen = readU32(contentBuf, off); off += 4;
          const altText = contentBuf.slice(off, off + altTextLen).toString('utf8'); off += altTextLen;
          const targetUrlLen = readU32(contentBuf, off); off += 4;
          const targetUrl = contentBuf.slice(off, off + targetUrlLen).toString('utf8');
          lease = {
            advertiserLockHash,
            startBlock,
            endBlock,
            pricePerBlock,
            totalLocked,
            content: {
              type: 'markdown_image',
              markdown: `![${altText}](${imageUrl})`,
              imageUrl,
              alt: altText,
              targetUrl
            }
          };
        }
      }
    }
  }
  return {
    minPricePerBlock: Number(minPricePerBlock),
    autoApprove,
    minLeaseBlocks,
    coolDownBlocks,
    createdAt: Number(createdAt),
    status,
    totalEarned: Number(totalEarned),
    lease
  };
}

async function fetchBillboardById(id) {
  if (!BILLBOARD_TYPE_CODE_HASH) {
    return null;
  }
  const collector = indexer.collector({
    type: {
      codeHash: BILLBOARD_TYPE_CODE_HASH,
      hashType: BILLBOARD_TYPE_HASH_TYPE,
      args: '0x' + id
    }
  });
  for await (const cell of collector.collect()) {
    const parsed = parseBillboardData(cell.data);
    if (!parsed) continue;
    return {
      outpoint: `${cell.outPoint.txHash}:${cell.outPoint.index}`,
      capacity: cell.cellOutput.capacity,
      lockArgs: cell.cellOutput.lock.args,
      ...parsed
    };
  }
  return null;
}

async function fetchBillboardsByOwner(ownerAddress) {
  // Simplified: query by type script without args filter, then filter by lock
  if (!BILLBOARD_TYPE_CODE_HASH) return [];
  const collector = indexer.collector({
    type: {
      codeHash: BILLBOARD_TYPE_CODE_HASH,
      hashType: BILLBOARD_TYPE_HASH_TYPE,
      args: '0x'
    },
    lock: {
      codeHash: process.env.BILLBOARD_LOCK_CODE_HASH || '',
      hashType: process.env.BILLBOARD_LOCK_HASH_TYPE || 'data2',
      args: ownerAddress // simplified
    }
  });
  const results = [];
  for await (const cell of collector.collect()) {
    const parsed = parseBillboardData(cell.data);
    if (!parsed) continue;
    results.push({
      outpoint: `${cell.outPoint.txHash}:${cell.outPoint.index}`,
      capacity: cell.cellOutput.capacity,
      lockArgs: cell.cellOutput.lock.args,
      ...parsed
    });
  }
  return results;
}

// API: Render billboard JSON
app.get('/v1/render/:id', async (req, res) => {
  try {
    const id = req.params.id.replace(/^0x/, '');
    const billboard = await fetchBillboardById(id);
    if (!billboard) {
      return res.status(404).json({ error: 'Billboard not found' });
    }
    const tipHeader = await rpc.getTipHeader();
    const currentBlock = Number(tipHeader.number);
    if (billboard.status === STATUS_LEASED && billboard.lease) {
      if (currentBlock > billboard.lease.endBlock) {
        return res.json({
          source: 'on-chain',
          status: 'available',
          config: { minPricePerBlock: billboard.minPricePerBlock },
          marketUrl: `${req.protocol}://${req.get('host')}/market/${id}`
        });
      }
      return res.json({
        source: 'on-chain',
        cellOutpoint: billboard.outpoint,
        status: 'leased',
        validUntilBlock: billboard.lease.endBlock,
        content: billboard.lease.content
      });
    }
    return res.json({
      source: 'on-chain',
      status: 'available',
      config: { minPricePerBlock: billboard.minPricePerBlock },
      marketUrl: `${req.protocol}://${req.get('host')}/market/${id}`
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// API: Render image
app.get('/v1/img/:id', async (req, res) => {
  try {
    const id = req.params.id.replace(/^0x/, '');
    const billboard = await fetchBillboardById(id);
    const tipHeader = await rpc.getTipHeader();
    const currentBlock = Number(tipHeader.number);
    if (billboard && billboard.status === STATUS_LEASED && billboard.lease) {
      if (currentBlock <= billboard.lease.endBlock) {
        return res.redirect(billboard.lease.content.imageUrl);
      }
    }
    // Return SVG placeholder
    const minPrice = billboard ? billboard.minPricePerBlock : 1000;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="728" height="90" xmlns="http://www.w3.org/2000/svg">
  <rect width="728" height="90" fill="#1a1a2e"/>
  <text x="364" y="40" font-family="Arial" font-size="18" fill="#eee" text-anchor="middle">CKB Billboard - Available for Rent</text>
  <text x="364" y="65" font-family="Arial" font-size="14" fill="#aaa" text-anchor="middle">Min price: ${minPrice} shannons/block</text>
</svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'max-age=60');
    res.send(svg);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error');
  }
});

// API: Click tracking + redirect
app.get('/v1/click/:id', async (req, res) => {
  try {
    const id = req.params.id.replace(/^0x/, '');
    const billboard = await fetchBillboardById(id);
    const tipHeader = await rpc.getTipHeader();
    const currentBlock = Number(tipHeader.number);
    if (billboard && billboard.status === STATUS_LEASED && billboard.lease) {
      if (currentBlock <= billboard.lease.endBlock) {
        // async log click
        console.log('Click tracked:', id, 'ref:', req.query.ref, 'time:', new Date().toISOString());
        return res.redirect(billboard.lease.content.targetUrl);
      }
    }
    res.redirect(`${req.protocol}://${req.get('host')}/market/${id}`);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error');
  }
});

// API: List creator billboards
app.get('/v1/creator/billboards', async (req, res) => {
  try {
    const owner = req.query.owner;
    if (!owner) return res.status(400).json({ error: 'owner required' });
    const billboards = await fetchBillboardsByOwner(owner);
    res.json(billboards);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// API: Market list
app.get('/v1/market/list', async (req, res) => {
  try {
    if (!BILLBOARD_TYPE_CODE_HASH) return res.json([]);
    const collector = indexer.collector({
      type: {
        codeHash: BILLBOARD_TYPE_CODE_HASH,
        hashType: BILLBOARD_TYPE_HASH_TYPE,
        args: '0x'
      }
    });
    const results = [];
    let count = 0;
    const limit = parseInt(req.query.limit || '50');
    for await (const cell of collector.collect()) {
      if (count >= limit) break;
      const parsed = parseBillboardData(cell.data);
      if (!parsed) continue;
      results.push({
        id: cell.cellOutput.lock.args.slice(40, 72) || cell.outPoint.txHash.slice(0, 16),
        outpoint: `${cell.outPoint.txHash}:${cell.outPoint.index}`,
        capacity: cell.cellOutput.capacity,
        status: parsed.status,
        minPricePerBlock: parsed.minPricePerBlock,
        autoApprove: parsed.autoApprove,
        totalEarned: parsed.totalEarned,
        lease: parsed.lease
      });
      count++;
    }
    res.json(results);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`CKB Billboard API running on port ${PORT}`);
});
