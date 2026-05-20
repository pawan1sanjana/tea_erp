/**
 * Agronomic Cycle Configuration
 * Centralized intervals and benchmarks for all agricultural operations.
 * These values can be fetched from an API in the future for estate-specific overrides.
 */

export const AGRONOMIC_CONFIG = {
  WEEDING: {
    INTERVAL_DAYS: 90,
    TARGET_ACRES_PER_PAX: 0.25,
    ROUNDS: ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5', 'Round 6']
  },
  MANURE: {
    INTERVAL_DAYS: 120,
    TARGET_KG_PER_PAX: 45,
    ROUNDS: ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5', 'Round 6']
  },
  FOLIAR: {
    INTERVAL_DAYS: 30,
    TARGET_ACRES_PER_PAX: 2.5,
    ROUNDS: ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5', 'Round 6', 'Round 7', 'Round 8', 'Round 9', 'Round 10', 'Round 11', 'Round 12']
  },
  LOPPING: {
    INTERVAL_DAYS: 180,
    TARGET_ACRES_PER_PAX: 0.5,
    ROUNDS: ['Round 1', 'Round 2']
  },
  PLUCKING: {
    INTERVAL_DAYS: 7, // Standard plucking cycle
    ROUNDS: ['Round 1', 'Round 2', 'Round 3', 'Round 4'] // Usually not rounds but cycles
  }
};
