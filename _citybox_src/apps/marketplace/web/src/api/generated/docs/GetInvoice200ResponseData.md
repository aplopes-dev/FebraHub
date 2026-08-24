
# GetInvoice200ResponseData


## Properties

Name | Type
------------ | -------------
`invoiceUrl` | string
`nfKey` | string
`issuedAt` | Date

## Example

```typescript
import type { GetInvoice200ResponseData } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "invoiceUrl": null,
  "nfKey": null,
  "issuedAt": null,
} satisfies GetInvoice200ResponseData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GetInvoice200ResponseData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


