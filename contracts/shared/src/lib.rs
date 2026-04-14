#![no_std]

use ckb_std::ckb_types::packed::Bytes;
use ckb_std::ckb_types::prelude::*;

pub const BILLBOARD_DATA_MIN_LEN: usize = 1 + 8 + 4 + 4 + 8 + 1 + 1 + 8; // config + status + optional lease flag + total_earned
pub const MIN_PRICE_PER_BLOCK_OFFSET: usize = 0;
pub const AUTO_APPROVE_OFFSET: usize = 8;
pub const MIN_LEASE_BLOCKS_OFFSET: usize = 9;
pub const COOLDOWN_BLOCKS_OFFSET: usize = 13;
pub const CREATED_AT_OFFSET: usize = 17;
pub const STATUS_OFFSET: usize = 25;
pub const TOTAL_EARNED_OFFSET: usize = 26;

pub const STATUS_AVAILABLE: u8 = 0;
pub const STATUS_LEASED: u8 = 1;

pub const CONTENT_TYPE_MARKDOWN_IMAGE: u8 = 0;

pub fn read_u64(data: &[u8], offset: usize) -> u64 {
    let mut bytes = [0u8; 8];
    bytes.copy_from_slice(&data[offset..offset + 8]);
    u64::from_le_bytes(bytes)
}

pub fn read_u32(data: &[u8], offset: usize) -> u32 {
    let mut bytes = [0u8; 4];
    bytes.copy_from_slice(&data[offset..offset + 4]);
    u32::from_le_bytes(bytes)
}

pub struct BillboardConfig<'a> {
    pub data: &'a [u8],
}

impl<'a> BillboardConfig<'a> {
    pub fn min_price_per_block(&self) -> u64 {
        read_u64(self.data, MIN_PRICE_PER_BLOCK_OFFSET)
    }
    pub fn auto_approve(&self) -> u8 {
        self.data[AUTO_APPROVE_OFFSET]
    }
    pub fn min_lease_blocks(&self) -> u32 {
        read_u32(self.data, MIN_LEASE_BLOCKS_OFFSET)
    }
    pub fn cool_down_blocks(&self) -> u32 {
        read_u32(self.data, COOLDOWN_BLOCKS_OFFSET)
    }
    pub fn created_at(&self) -> u64 {
        read_u64(self.data, CREATED_AT_OFFSET)
    }
}

pub struct BillboardData<'a> {
    pub data: &'a [u8],
}

impl<'a> BillboardData<'a> {
    pub fn from_slice(data: &'a [u8]) -> Self {
        Self { data }
    }
    pub fn config(&self) -> BillboardConfig<'a> {
        BillboardConfig {
            data: &self.data[..25],
        }
    }
    pub fn status(&self) -> u8 {
        self.data[STATUS_OFFSET]
    }
    pub fn total_earned(&self) -> u64 {
        read_u64(self.data, TOTAL_EARNED_OFFSET)
    }
    pub fn has_lease(&self) -> bool {
        self.data.len() > 34
    }
}

pub struct LeaseInfo<'a> {
    pub data: &'a [u8],
    pub offset: usize,
}

impl<'a> LeaseInfo<'a> {
    pub fn from_billboard_data(data: &'a [u8]) -> Option<Self> {
        if data.len() <= 34 {
            return None;
        }
        Some(Self { data, offset: 34 })
    }
    pub fn advertiser_lock_hash(&self) -> &[u8] {
        &self.data[self.offset..self.offset + 20]
    }
    pub fn start_block(&self) -> u64 {
        read_u64(self.data, self.offset + 20)
    }
    pub fn end_block(&self) -> u64 {
        read_u64(self.data, self.offset + 28)
    }
    pub fn price_per_block(&self) -> u64 {
        read_u64(self.data, self.offset + 36)
    }
    pub fn total_locked(&self) -> u64 {
        read_u64(self.data, self.offset + 44)
    }
}

pub fn validate_url(url: &[u8]) -> bool {
    if url.len() > 500 {
        return false;
    }
    let https_prefix = b"https://";
    if url.len() < https_prefix.len() {
        return false;
    }
    if &url[..https_prefix.len()] != https_prefix {
        return false;
    }
    for &b in url {
        if b == b'<' || b == b'>' || b == b'"' || b == b'\'' {
            return false;
        }
    }
    true
}

pub fn validate_content(content: &[u8]) -> bool {
    if content.len() < 1 {
        return false;
    }
    let content_type = content[0];
    if content_type != CONTENT_TYPE_MARKDOWN_IMAGE {
        return false;
    }
    let mut offset = 1;
    if content.len() < offset + 4 {
        return false;
    }
    let image_url_len = read_u32(content, offset) as usize;
    offset += 4;
    if content.len() < offset + image_url_len {
        return false;
    }
    let image_url = &content[offset..offset + image_url_len];
    offset += image_url_len;
    if !validate_url(image_url) {
        return false;
    }
    if content.len() < offset + 4 {
        return false;
    }
    let alt_text_len = read_u32(content, offset) as usize;
    offset += 4;
    if content.len() < offset + alt_text_len {
        return false;
    }
    offset += alt_text_len;
    if alt_text_len > 200 {
        return false;
    }
    if content.len() < offset + 4 {
        return false;
    }
    let target_url_len = read_u32(content, offset) as usize;
    offset += 4;
    if content.len() < offset + target_url_len {
        return false;
    }
    let target_url = &content[offset..offset + target_url_len];
    if !validate_url(target_url) {
        return false;
    }
    offset += target_url_len;
    offset == content.len()
}
