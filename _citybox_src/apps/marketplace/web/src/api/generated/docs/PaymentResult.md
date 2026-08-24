
# PaymentResult

Resultado do pagamento conforme o tipo (PIX/CARD/BOLETO)

## Properties

Name | Type
------------ | -------------
`type` | [PaymentType](PaymentType.md)
`status` | string
`paymentMethodId` | string
`displayName` | string
`authorizationCode` | string
`pixQrCodeBase64` | string
`pixCopyPaste` | string
`barcode` | string
`digitableLine` | string
`dueDate` | Date
`pdfUrl` | string
`expiresAt` | Date

## Example

```typescript
import type { PaymentResult } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "type": null,
  "status": null,
  "paymentMethodId": null,
  "displayName": null,
  "authorizationCode": null,
  "pixQrCodeBase64": null,
  "pixCopyPaste": null,
  "barcode": null,
  "digitableLine": null,
  "dueDate": null,
  "pdfUrl": null,
  "expiresAt": null,
} satisfies PaymentResult

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PaymentResult
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


