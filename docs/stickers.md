The file `stickers.json` contains several sticker sets. Each sticker set,
such as the `pepe` set, has stickers for different types of responses.
Each response can have multiple stickers, in which case one is chosen at
random.

The stickers are:

* `about`: Response to `/about`
* `stats`: Response to `/stats`
* `insufficient-balance`: Response when user tries to exceed his available balance
* `intro`: Not sure if used
* `balance`: See below
* `claim`: Response to `/claim` (introduction)

The `balance` stickers are different in that they vary by the USD balance
of the user initiating the command. For example:

```
"balance": [
  [0, ["foo"]],
  [0.01, ["bar"]],
  [100, ["baz", "raz"]]
]
```

In this setup, the bot responds with:

* The `baz` or `raz` sticker if the user has a USD equivalent balance $100 or greater
* The `bar` sticker if the user has $0.01 or more
* The `foo` sticker if the user has less than $0.01

Stickers are identified by their unique Telegram Sticker ID. These can be found
by sending the sticker to the Telegram user [@getStickerId_bot](https://t.me/@getStickerId_bot).
