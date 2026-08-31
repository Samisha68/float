/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/float.json`.
 */
export type Float = {
  "address": "6NjXwwwuFNWV3MBk2r2wv68hDde1snEiMMfwrvQ31Db8",
  "metadata": {
    "name": "float",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Float — short-term working-capital advances for verified businesses"
  },
  "instructions": [
    {
      "name": "approveAndDisburse",
      "docs": [
        "The underwriter approves and the treasury disburses in one step.",
        "",
        "The fee is set here, within the policy cap. A business seeking more than",
        "the tier-1 ceiling must have a pledge recorded off-chain; the program",
        "enforces the ceiling itself."
      ],
      "discriminator": [
        165,
        31,
        0,
        103,
        166,
        166,
        239,
        157
      ],
      "accounts": [
        {
          "name": "underwriter",
          "writable": true,
          "signer": true
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "business",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  115,
                  105,
                  110,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "business.authority",
                "account": "businessProfile"
              }
            ]
          }
        },
        {
          "name": "advance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  118,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "business"
              },
              {
                "kind": "account",
                "path": "advance.nonce",
                "account": "advance"
              }
            ]
          }
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "treasuryUsdc",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "borrowerUsdc",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "borrower"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "borrower"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "feeBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "initializeTreasury",
      "docs": [
        "Stand up the treasury that funds advances. Called once by the operator."
      ],
      "discriminator": [
        124,
        186,
        211,
        195,
        85,
        165,
        129,
        166
      ],
      "accounts": [
        {
          "name": "operator",
          "writable": true,
          "signer": true
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "treasuryUsdc",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "markOverdue",
      "docs": [
        "Flag an advance past its due date. Permissionless — anyone may call it,",
        "so the record cannot be suppressed by the borrower or the operator."
      ],
      "discriminator": [
        178,
        135,
        117,
        229,
        133,
        152,
        175,
        27
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "Anyone may flag an overdue advance."
          ],
          "signer": true
        },
        {
          "name": "business",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  115,
                  105,
                  110,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "business.authority",
                "account": "businessProfile"
              }
            ]
          }
        },
        {
          "name": "advance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  118,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "business"
              },
              {
                "kind": "account",
                "path": "advance.nonce",
                "account": "advance"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "registerBusiness",
      "docs": [
        "Register a business. `kyb_reference` is a hash of the off-chain KYB",
        "record (registration documents, verified payer details) — the documents",
        "themselves never touch the chain."
      ],
      "discriminator": [
        73,
        228,
        5,
        59,
        229,
        67,
        133,
        82
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "business",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  115,
                  105,
                  110,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "legalName",
          "type": "string"
        },
        {
          "name": "kybReference",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "repayAdvance",
      "docs": [
        "The business repays principal plus fee in full. Partial repayment is",
        "deliberately not supported in the MVP."
      ],
      "discriminator": [
        247,
        119,
        157,
        136,
        70,
        66,
        200,
        20
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "business",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  115,
                  105,
                  110,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "advance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  118,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "business"
              },
              {
                "kind": "account",
                "path": "advance.nonce",
                "account": "advance"
              }
            ]
          }
        },
        {
          "name": "usdcMint"
        },
        {
          "name": "treasuryUsdc",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "treasury"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "borrowerUsdc",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "usdcMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "requestAdvance",
      "docs": [
        "A business requests an advance against a delayed inbound payment.",
        "",
        "`evidence_reference` is a hash of the off-chain evidence bundle (the",
        "invoice, the payer verification, the expected settlement date).",
        "`expected_inflow` is the verified amount owed to the business — the",
        "advance is bounded by it so the ceiling cannot be inflated by anything",
        "the borrower can manufacture."
      ],
      "discriminator": [
        30,
        94,
        222,
        131,
        223,
        83,
        0,
        28
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "business",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  115,
                  105,
                  110,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "advance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  118,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "business"
              },
              {
                "kind": "arg",
                "path": "nonce"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "nonce",
          "type": "u64"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "expectedInflow",
          "type": "u64"
        },
        {
          "name": "termDays",
          "type": "u16"
        },
        {
          "name": "evidenceReference",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "setUnderwriter",
      "docs": [
        "Point the underwriter role at a different key."
      ],
      "discriminator": [
        100,
        73,
        161,
        131,
        128,
        144,
        113,
        17
      ],
      "accounts": [
        {
          "name": "operator",
          "writable": true,
          "signer": true
        },
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newUnderwriter",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "advance",
      "discriminator": [
        66,
        25,
        217,
        133,
        38,
        192,
        224,
        218
      ]
    },
    {
      "name": "businessProfile",
      "discriminator": [
        11,
        163,
        172,
        189,
        75,
        174,
        145,
        26
      ]
    },
    {
      "name": "treasury",
      "discriminator": [
        238,
        239,
        123,
        238,
        89,
        1,
        168,
        253
      ]
    }
  ],
  "events": [
    {
      "name": "advanceDisbursed",
      "discriminator": [
        102,
        61,
        214,
        163,
        169,
        88,
        101,
        194
      ]
    },
    {
      "name": "advanceOverdue",
      "discriminator": [
        74,
        131,
        211,
        219,
        253,
        74,
        208,
        63
      ]
    },
    {
      "name": "advanceRepaid",
      "discriminator": [
        185,
        191,
        136,
        90,
        224,
        95,
        1,
        197
      ]
    },
    {
      "name": "advanceRequested",
      "discriminator": [
        139,
        249,
        209,
        108,
        1,
        107,
        150,
        25
      ]
    },
    {
      "name": "businessRegistered",
      "discriminator": [
        26,
        72,
        190,
        66,
        63,
        254,
        216,
        225
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Caller is not authorised for this action"
    },
    {
      "code": 6001,
      "name": "emptyLegalName",
      "msg": "Legal name must not be empty"
    },
    {
      "code": 6002,
      "name": "legalNameTooLong",
      "msg": "Legal name exceeds the maximum length"
    },
    {
      "code": 6003,
      "name": "invalidAmount",
      "msg": "Advance amount must be greater than zero"
    },
    {
      "code": 6004,
      "name": "exceedsAbsoluteCeiling",
      "msg": "Advance exceeds the absolute programme ceiling"
    },
    {
      "code": 6005,
      "name": "exceedsTier1Ceiling",
      "msg": "Advance exceeds the tier-1 ceiling of $5,000"
    },
    {
      "code": 6006,
      "name": "advanceExceedsInflow",
      "msg": "Advance may not exceed the verified expected inflow"
    },
    {
      "code": 6007,
      "name": "invalidTerm",
      "msg": "Term must be between 1 and 60 days"
    },
    {
      "code": 6008,
      "name": "feeTooHigh",
      "msg": "Fee exceeds the maximum permitted"
    },
    {
      "code": 6009,
      "name": "advanceNotRequested",
      "msg": "Advance is not awaiting approval"
    },
    {
      "code": 6010,
      "name": "advanceNotRepayable",
      "msg": "Advance is not in a repayable state"
    },
    {
      "code": 6011,
      "name": "advanceNotActive",
      "msg": "Advance is not active"
    },
    {
      "code": 6012,
      "name": "notYetOverdue",
      "msg": "Advance is not yet past its due date"
    },
    {
      "code": 6013,
      "name": "advanceBusinessMismatch",
      "msg": "Advance does not belong to this business"
    },
    {
      "code": 6014,
      "name": "wrongMint",
      "msg": "Token mint does not match the treasury mint"
    },
    {
      "code": 6015,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "advance",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "business",
            "type": "pubkey"
          },
          {
            "name": "borrower",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "expectedInflow",
            "type": "u64"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "totalDue",
            "type": "u64"
          },
          {
            "name": "termDays",
            "type": "u16"
          },
          {
            "name": "evidenceReference",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "requestedAt",
            "type": "i64"
          },
          {
            "name": "disbursedAt",
            "type": "i64"
          },
          {
            "name": "dueAt",
            "type": "i64"
          },
          {
            "name": "repaidAt",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "advanceStatus"
              }
            }
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "advanceDisbursed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "advance",
            "type": "pubkey"
          },
          {
            "name": "business",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "totalDue",
            "type": "u64"
          },
          {
            "name": "dueAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "advanceOverdue",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "advance",
            "type": "pubkey"
          },
          {
            "name": "business",
            "type": "pubkey"
          },
          {
            "name": "dueAt",
            "type": "i64"
          },
          {
            "name": "flaggedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "advanceRepaid",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "advance",
            "type": "pubkey"
          },
          {
            "name": "business",
            "type": "pubkey"
          },
          {
            "name": "totalDue",
            "type": "u64"
          },
          {
            "name": "wasLate",
            "type": "bool"
          },
          {
            "name": "advancesRepaid",
            "type": "u32"
          },
          {
            "name": "totalVolumeRepaid",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "advanceRequested",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "advance",
            "type": "pubkey"
          },
          {
            "name": "business",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "expectedInflow",
            "type": "u64"
          },
          {
            "name": "termDays",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "advanceStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "requested"
          },
          {
            "name": "active"
          },
          {
            "name": "repaid"
          },
          {
            "name": "overdue"
          }
        ]
      }
    },
    {
      "name": "businessProfile",
      "docs": [
        "The credit record. Public, permanent, and tied to the business's key."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "legalName",
            "type": "string"
          },
          {
            "name": "kybReference",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "advancesTaken",
            "type": "u32"
          },
          {
            "name": "advancesRepaid",
            "type": "u32"
          },
          {
            "name": "advancesOverdue",
            "type": "u32"
          },
          {
            "name": "totalVolumeRepaid",
            "type": "u64"
          },
          {
            "name": "registeredAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "businessRegistered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "business",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "treasury",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "operator",
            "type": "pubkey"
          },
          {
            "name": "underwriter",
            "type": "pubkey"
          },
          {
            "name": "usdcMint",
            "type": "pubkey"
          },
          {
            "name": "advancesFunded",
            "type": "u64"
          },
          {
            "name": "principalOutstanding",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
