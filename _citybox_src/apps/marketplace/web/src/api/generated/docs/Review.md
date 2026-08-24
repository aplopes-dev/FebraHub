
# Review


## Properties

Name | Type
------------ | -------------
`id` | string
`productId` | string
`author` | string
`rating` | number
`date` | Date
`text` | string
`photoUrls` | Array&lt;string&gt;

## Example

```typescript
import type { Review } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "productId": null,
  "author": null,
  "rating": null,
  "date": null,
  "text": null,
  "photoUrls": null,
} satisfies Review

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Review
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


