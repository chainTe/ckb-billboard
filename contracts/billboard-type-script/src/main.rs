#![no_std]
#![no_main]

use ckb_std::ckb_constants::Source;
use ckb_std::ckb_types::prelude::*;
use ckb_std::default_alloc;
use ckb_std::error::SysError;
use ckb_std::high_level::{load_cell_data, load_input_since, load_script, QueryIter};
use shared::{validate_content, BillboardData, LeaseInfo, STATUS_AVAILABLE, STATUS_LEASED};

ckb_std::entry!(program_entry);

default_alloc!();

#[derive(Debug)]
pub enum Error {
    SysError(SysError),
    InvalidData,
    InvalidStateTransition,
    ContentValidationFailed,
    LeaseExpired,
    InsufficientCapacity,
}

impl From<SysError> for Error {
    fn from(err: SysError) -> Self {
        Error::SysError(err)
    }
}

pub fn program_entry() -> i8 {
    match validate_type_script() {
        Ok(_) => 0,
        Err(e) => {
            ckb_std::debug!("Billboard Type Script error: {:?}", e);
            1
        }
    }
}

fn validate_type_script() -> Result<(), Error> {
    let script = load_script()?;
    let args = script.args().raw_data();
    if args.len() < 1 {
        return Err(Error::InvalidData);
    }
    let _version = args[0];
    let group_input_count = QueryIter::new(load_cell_data, Source::GroupInput).count();
    let _group_output_count = QueryIter::new(load_cell_data, Source::GroupOutput).count();
    if group_input_count == 0 {
        return Ok(());
    }
    let input_data = load_cell_data(0, Source::GroupInput)?;
    let output_data = load_cell_data(0, Source::GroupOutput)?;
    let input_billboard = BillboardData::from_slice(&input_data);
    let output_billboard = BillboardData::from_slice(&output_data);
    let input_status = input_billboard.status();
    let output_status = output_billboard.status();
    match (input_status, output_status) {
        (STATUS_AVAILABLE, STATUS_LEASED) => {
            validate_available_to_leased(&input_data, &output_data)?;
        }
        (STATUS_LEASED, STATUS_AVAILABLE) => {
            validate_leased_to_available(&input_data, &output_data)?;
        }
        (STATUS_LEASED, STATUS_LEASED) => {
            validate_leased_to_leased(&input_data, &output_data)?;
        }
        (STATUS_AVAILABLE, STATUS_AVAILABLE) => {
            return Err(Error::InvalidStateTransition);
        }
        _ => {
            return Err(Error::InvalidStateTransition);
        }
    }
    Ok(())
}

fn validate_available_to_leased(_input_data: &[u8], output_data: &[u8]) -> Result<(), Error> {
    let output_billboard = BillboardData::from_slice(output_data);
    if !output_billboard.has_lease() {
        return Err(Error::InvalidData);
    }
    let lease = LeaseInfo::from_billboard_data(output_data).unwrap();
    let config = output_billboard.config();
    let lease_blocks = lease.end_block().saturating_sub(lease.start_block());
    if lease_blocks < config.min_lease_blocks() as u64 {
        return Err(Error::InvalidData);
    }
    if lease.price_per_block() < config.min_price_per_block() {
        return Err(Error::InvalidData);
    }
    let since = load_input_since(0, Source::GroupInput)?;
    let current_block = since >> 40;
    if lease.start_block() > current_block || lease.end_block() <= current_block {
        return Err(Error::InvalidData);
    }
    let content_offset = 34 + 20 + 8 + 8 + 8 + 8 + 8;
    if output_data.len() <= content_offset {
        return Err(Error::InvalidData);
    }
    let content_len = shared::read_u32(output_data, content_offset) as usize;
    let content_start = content_offset + 4;
    if output_data.len() < content_start + content_len {
        return Err(Error::InvalidData);
    }
    let content = &output_data[content_start..content_start + content_len];
    if !validate_content(content) {
        return Err(Error::ContentValidationFailed);
    }
    let expected_total = lease.price_per_block().saturating_mul(lease_blocks);
    if lease.total_locked() != expected_total {
        return Err(Error::InvalidData);
    }
    Ok(())
}

fn validate_leased_to_available(input_data: &[u8], output_data: &[u8]) -> Result<(), Error> {
    let input_billboard = BillboardData::from_slice(input_data);
    let output_billboard = BillboardData::from_slice(output_data);
    if !input_billboard.has_lease() {
        return Err(Error::InvalidData);
    }
    let input_lease = LeaseInfo::from_billboard_data(input_data).unwrap();
    let since = load_input_since(0, Source::GroupInput)?;
    let current_block = since >> 40;
    if current_block <= input_lease.end_block() {
        return Err(Error::InvalidStateTransition);
    }
    if output_billboard.has_lease() {
        return Err(Error::InvalidData);
    }
    Ok(())
}

fn validate_leased_to_leased(input_data: &[u8], output_data: &[u8]) -> Result<(), Error> {
    let input_billboard = BillboardData::from_slice(input_data);
    let output_billboard = BillboardData::from_slice(output_data);
    if !input_billboard.has_lease() || !output_billboard.has_lease() {
        return Err(Error::InvalidData);
    }
    let input_lease = LeaseInfo::from_billboard_data(input_data).unwrap();
    let since = load_input_since(0, Source::GroupInput)?;
    let current_block = since >> 40;
    let config = input_billboard.config();
    let cool_down_end = input_lease
        .start_block()
        .saturating_add(config.cool_down_blocks() as u64);
    if current_block <= cool_down_end {
        return Err(Error::InvalidStateTransition);
    }
    let min_new_price = input_lease.price_per_block().saturating_mul(120) / 100;
    if output_lease_price(output_data) < min_new_price {
        return Err(Error::InvalidData);
    }
    validate_available_to_leased(input_data, output_data)?;
    Ok(())
}

fn output_lease_price(output_data: &[u8]) -> u64 {
    let lease = LeaseInfo::from_billboard_data(output_data);
    if let Some(l) = lease {
        l.price_per_block()
    } else {
        0
    }
}
