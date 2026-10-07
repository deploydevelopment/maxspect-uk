# Maxspect product API

Public JSON feeds for the Maxspect catalogue. No API key and no login. Every response is JSON, UTF-8, and can be called from another website (CORS is open).

These feeds only return **live** records: products, ranges, and subranges with `status = 0`. Hidden or archived items are left out.

## Base URL

```
https://app.supplyengine.co.uk/api/
```

The `api` folder has to be on that host before these URLs respond. Until then they 404.

## Account

Use these two query parameters on every request:

| Parameter | Value |
| --- | --- |
| `username` | `bcuk` |
| `channel` | `maxspect.co.uk` |

`channel` may also be the numeric id `2`. The other channels on this account are `food4fish.co.uk` (`1`) and `glamorca.co.uk` (`3`). This guide is for Maxspect only.

## How the catalogue is organised

- A **channel** is the website the product is sold on. Maxspect is `maxspect.co.uk`.
- A **range** is a top-level group, such as Spares.
- A **subrange** sits inside a range. The sort list on [maxspect.co.uk/shop](https://maxspect.co.uk/shop/) (Gyre, Razor, Ethereal, and so on) is the subranges of **Spares**.
- A **product** can belong to more than one range and more than one subrange.

Range ids and subrange ids are separate sequences. Spares and Gyre can both be `11`. Always call the endpoint that matches the thing you mean.

## Suggested page flow

1. Load the Spares range to build the range menu.
2. Load one subrange to list the products in that group.
3. Load one product for the product page.
4. Use the channel list only when you need every live Maxspect product in one response.

## Prices

Every response includes:

| Field | Meaning for Maxspect |
| --- | --- |
| `currency` | `GBP` |
| `tax_rate` | `20` |
| `prices_include_tax` | `true` |

`price` is the figure to show the customer. For Maxspect that is the stored price plus 20% VAT. `price_ex_tax` is the stored price before VAT. A product with `tax_disabled: true` is not grossed up, so `price` and `price_ex_tax` match.

Example: the Xepta reagent pump is stored at `45.00` and `price` is `54`.

`description` is HTML.

Image fields are absolute URLs on `app.supplyengine.co.uk`.

## 1. Range

One live range, plus every live subrange inside it. Nested subranges are in each node's `subranges` array.

```
GET /api/range.php?username=bcuk&channel=maxspect.co.uk&id=11
GET /api/range.php?username=bcuk&channel=maxspect.co.uk&name=Spares
```

`id` or `name` is required. Prefer `id` after the first lookup.

```json
{
  "username": "bcuk",
  "channel": { "id": 2, "name": "maxspect.co.uk" },
  "currency": "GBP",
  "tax_rate": 20,
  "prices_include_tax": true,
  "range": {
    "id": 11,
    "name": "Spares",
    "slug": "spares",
    "description": "",
    "image": ""
  },
  "subranges": [
    {
      "id": 11,
      "name": "Gyre",
      "slug": "gyre",
      "description": "",
      "image": "",
      "subranges": []
    }
  ]
}
```

The Spares range currently has 22 live subranges. Use `subranges[].id` for the subrange endpoint.

## 2. Subrange

One live subrange, its parent range, any subranges above it, any further subranges below it, and the live products filed in this subrange.

```
GET /api/subrange.php?username=bcuk&channel=maxspect.co.uk&id=11
GET /api/subrange.php?username=bcuk&channel=maxspect.co.uk&name=Gyre
```

Gyre (`id=11`) currently returns 78 products. Those products are the short records below, not the full product record. Call the product endpoint for a product page.

```json
{
  "username": "bcuk",
  "channel": { "id": 2, "name": "maxspect.co.uk" },
  "currency": "GBP",
  "tax_rate": 20,
  "prices_include_tax": true,
  "subrange": {
    "id": 11,
    "name": "Gyre",
    "slug": "gyre",
    "description": "",
    "image": ""
  },
  "range": {
    "id": 11,
    "name": "Spares",
    "slug": "spares",
    "description": "",
    "image": ""
  },
  "parents": [],
  "subranges": [],
  "count": 78,
  "products": [
    {
      "id": 900,
      "name": "Jump Gyre 2k Controller",
      "slug": "jump-gyre-2k-controller",
      "sku": "",
      "barcode": "",
      "description": "",
      "bullets": "",
      "price": 59.99,
      "price_ex_tax": 49.99,
      "price_was": null,
      "stock_level": 0,
      "brand": "Maxspect",
      "ranges": ["Spares"],
      "subranges": ["Gyre"],
      "images": ["https://app.supplyengine.co.uk/assets/bcuk/media/example.jpg"],
      "thumbnails": ["https://app.supplyengine.co.uk/assets/bcuk/media-thu/example.jpg"]
    }
  ]
}
```

`parents` is empty when this subrange sits directly under the range. When it is nested, `parents` lists the subranges above it, nearest ancestor last is not guaranteed: they are listed from the top of the tree downward. `subranges` is the tree underneath this subrange.

`stock_level` is a unit count. `0` means none recorded, not "call failed".

`ranges` and `subranges` on a short product are name strings. On the full product endpoint they are objects with `id`, `name`, and `slug`.

## 3. Product

The full live record for one product on this channel.

```
GET /api/product.php?username=bcuk&channel=maxspect.co.uk&id=1036
```

`id` is required. Names are not accepted here because product names are not unique.

```json
{
  "username": "bcuk",
  "channel": { "id": 2, "name": "maxspect.co.uk" },
  "currency": "GBP",
  "tax_rate": 20,
  "prices_include_tax": true,
  "product": {
    "id": 1036,
    "name": "Xepta autoBalance/Stepper Motor Reagent Pump",
    "slug": "xepta-autobalancestepper-motor-reagent-pump",
    "sku": "XES1208",
    "barcode": "",
    "description": "<p>Replacement reagent pump complete including motor for autoBalance units.</p>",
    "bullets": "",
    "price": 54,
    "price_ex_tax": 45,
    "price_was": null,
    "price_was_ex_tax": null,
    "stock_level": 0,
    "brand": "Xepta",
    "brand_id": 11,
    "ranges": [{ "id": 11, "name": "Spares", "slug": "spares" }],
    "subranges": [{ "id": 112, "name": "Xepta autoBalance", "slug": "xepta-autobalance" }],
    "images": ["https://app.supplyengine.co.uk/assets/bcuk/media/xepta/20221209_143951.jpg"],
    "thumbnails": ["https://app.supplyengine.co.uk/assets/bcuk/media-thu/xepta/20221209_143951.jpg"],
    "pack_price": 42.42,
    "pack_price_ex_tax": 35.35,
    "pack_count": 1,
    "clearance_price": null,
    "clearance_price_ex_tax": null,
    "clearance_count": null,
    "clearance_message": "",
    "clearance_description": "",
    "tax_disabled": false,
    "types": [],
    "labels": [],
    "documents": [],
    "optional_product_ids": [],
    "video_url": "",
    "width_mm": 0,
    "height_mm": 0,
    "length_mm": 0,
    "weight_g": 0,
    "group_name": "",
    "meta_title": "",
    "meta_description": ""
  }
}
```

Show `price`. Use `price_was` as a compare-at price when it is not `null`. Pack and clearance prices follow the same VAT rule. Documents, when present, are `{ "id", "name", "file" }` and `file` is a URL. `optional_product_ids` are other product ids on this same API.

Dimensions are millimetres. Weight is grams. `0` means not set.

## All products on the channel

One response with every live Maxspect product, using the short product shape from the subrange feed.

```
GET /api/products.php?username=bcuk&channel=maxspect.co.uk
```

```json
{
  "username": "bcuk",
  "channel": { "id": 2, "name": "maxspect.co.uk" },
  "currency": "GBP",
  "tax_rate": 20,
  "prices_include_tax": true,
  "count": 305,
  "products": []
}
```

This is the whole channel, not only the Spares shop. The public spares page is a smaller set. For that page, start from the Spares range and then each subrange.

## Errors

Failures are JSON too, with an `error` string.

| HTTP | When |
| --- | --- |
| 400 | Missing or invalid `username`, `channel`, or `id` |
| 404 | Account, channel, range, subrange, or product was not found, or it is not live on this channel |
| 409 | `name` matched more than one range or subrange. The body includes the matches. Call again with `id` |
| 500 | The account catalogue could not be opened |

A 404 for an unknown channel includes the live channel names:

```json
{
  "error": "No channel matched that name.",
  "channels": [
    { "id": 1, "name": "food4fish.co.uk" },
    { "id": 2, "name": "maxspect.co.uk" },
    { "id": 3, "name": "glamorca.co.uk" }
  ]
}
```

## Customers

This feed is not public. Send the key on every request. It returns live customers (`status = 0`) who belong to any of the group ids you pass. A customer in more than one of those groups is returned once.

Pass ids as a comma-separated string. There is no channel parameter.

```
GET /api/customers.php?username=bcuk&key=KEY&groups=4
GET /api/customers.php?username=bcuk&key=KEY&groups=4,29,28
```

The key may be sent as the `key` query parameter, or as the `X-Api-Key` header.

```
d7ce6b19e8967082f391e370fd04af1d566b50cfe6efc009
```

Maxspect groups on this account:

| id | name |
| --- | --- |
| 4 | Maxspect Stockists |
| 11 | From the Maxspect Website |
| 28 | Maxspect Stockist Account |
| 29 | Maxspect Dealer Account |

```json
{
  "username": "bcuk",
  "groups": [
    { "id": 4, "name": "Maxspect Stockists" }
  ],
  "count": 1,
  "customers": [
    {
      "id": 1,
      "account_type": 2,
      "organisation": "Example Aquatics",
      "title": "",
      "name": "Alex",
      "surname": "Smith",
      "name_2": "",
      "surname_2": "",
      "name_3": "",
      "surname_3": "",
      "email": "shop@example.com",
      "email_2": "",
      "email_3": "",
      "email_4": "",
      "telephone": "01507 000000",
      "telephone_2": "",
      "telephone_3": "",
      "telephone_4": "",
      "mobile": "",
      "mobile_2": "",
      "mobile_3": "",
      "fax": "",
      "website": "example.com",
      "house": "1",
      "street": "High Street",
      "town": "Louth",
      "county": "Lincolnshire",
      "postcode": "LN11 0YB",
      "country_code": "GB",
      "opening_times": "",
      "notes": "",
      "stockist": true,
      "credit_limit": null,
      "unsubscribed": false,
      "delivery_zone_id": null,
      "payment_method_ids": [],
      "parent_org_id": null,
      "parent_org": "",
      "groups": [
        { "id": 4, "name": "Maxspect Stockists" }
      ]
    }
  ]
}
```

`account_type` is `1` for a person and `2` for a business. `groups` on each customer is every group they belong to, not only the ones in the request. Passwords are not included.

A missing or wrong key returns `401`. An unknown group id returns `404` and does not return the other groups in that request. A missing `groups` value returns `400`.

## Notes for the other site

- Cache responses. The catalogue changes when products are edited in Supply Engine, not on a fixed schedule. A few minutes is enough for a shop listing.
- Do not treat `stock_level: 0` as out of stock unless the design asks for that. Many live products have no stock figure recorded.
- Keep using `id` from a previous response when you link to a product, range, or subrange. `slug` is derived from the name and can change if the name is edited.
- The feeds are unauthenticated. They expose the same catalogue already shown on the Maxspect shop, not customer or order data.
