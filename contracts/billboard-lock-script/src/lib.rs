#![no_std]
#![no_main]

use ckb_std::ckb_constants::Source;
use ckb_std::default_alloc;
use ckb_std::error::SysError;
use ckb_std::high_level::{load_cell_lock_hash, load_script, load_witness_args, QueryIter};

ckb_std::entry!(program_entry);

default_alloc!();

#[derive(Debug)]
pub enum Error {
    SysError(SysError),
    InvalidArgs,
    SignatureMissing,
    InvalidSignature,
}

impl From<SysError> for Error {
    fn from(err: SysError) -> Self {
        Error::SysError(err)
    }
}

pub fn program_entry() -> i8 {
    match validate_lock_script() {
        Ok(_) => 0,
        Err(e) => {
            ckb_std::debug!("Billboard Lock Script error: {:?}", e);
            1
        }
    }
}

fn validate_lock_script() -> Result<(), Error> {
    let script = load_script()?;
    let args = script.args().raw_data();
    if args.len() < 20 {
        return Err(Error::InvalidArgs);
    }
    let _owner_pk_hash = &args[..20];
    let _billboard_id = if args.len() >= 36 {
        Some(&args[20..36])
    } else {
        None
    };
    let witness_args = load_witness_args(0, Source::GroupInput)?;
    if witness_args.lock().to_opt().is_none() {
        return Err(Error::SignatureMissing);
    }
    let group_input_count = QueryIter::new(load_cell_lock_hash, Source::GroupInput).count();
    if group_input_count == 0 {
        return Err(Error::InvalidSignature);
    }
    Ok(())
}
