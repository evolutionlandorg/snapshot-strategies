# Evolution Land Dao strategy

Here is an example of parameters:
```json
[
  {
    "name": "Evolution Land Dao Governance strategy",
    "strategy": {
      "name": "evolution-land-dao",
      "params": {
        "symbol": "EvolutionLand",
        "strategies": [
          {
            "name": "erc721-balance-of",
            "network": "44",
            "params": {
              "address": "0x6Ab81AF040fec3c13685ccFB26eC50C8aAB46445",
              "decimals": 18,
              "land_multiplier": 1,
              "apostle_multiplier": 1,
              "kton_multiplier": 1
            }
          }
        ]
      }
    },
    "network": "1",
    "addresses": [
      "0xaffb6a90135b416c2dfe6e790185b42b445296ea",
      "0x7eef076bc5c57afd42ac3cbf3e29b13a7baf4cac",
      "0x735182c782cb8e7806f8903de7913e6880cbf82e",
      "0xe59261f6d4088bcd69985a3d369ff14cc54ef1e5",
      "0xe1b0880460491c3d06607420cab0e5bc5f7f5963",
      "0x5a91fe74ab3788ff58187acaf3fb0a039534428e"
    ],
    "snapshot": 13803640
  }
]
```
