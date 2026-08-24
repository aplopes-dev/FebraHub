
# Product


## Properties

Name | Type
------------ | -------------
`id` | string
`name` | string
`imageUrl` | string
`price` | number
`originalPrice` | number
`discountPercent` | number
`rating` | number
`reviewCount` | number
`isFreeShipping` | boolean
`isExpress` | boolean
`category` | string
`categoryId` | string
`brand` | string
`specs` | { [key: string]: string; }

## Example

```typescript
import type { Product } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "imageUrl": null,
  "price": null,
  "originalPrice": null,
  "discountPercent": null,
  "rating": null,
  "reviewCount": null,
  "isFreeShipping": null,
  "isExpress": null,
  "category": null,
  "categoryId": null,
  "brand": null,
  "specs": null,
} satisfies Product

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Product
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


