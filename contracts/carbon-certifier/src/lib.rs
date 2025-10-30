#![no_std]

mod contract;

#[cfg(test)]
mod test;

// Re-exportar el contrato
pub use contract::*;

