
# Order


## Properties

Name | Type
------------ | -------------
`id` | string
`items` | [Array&lt;OrderItem&gt;](OrderItem.md)
`status` | [OrderStatus](OrderStatus.md)
`deliveryDate` | string
`address` | [Address](Address.md)
`paymentMethod` | [OrderPaymentMethod](OrderPaymentMethod.md)
`subtotal` | number
`shipping` | number
`discount` | number
`pixDiscount` | number
`total` | number
`trackingCode` | string
`carrier` | string
`statusHistory` | [Array&lt;OrderStatusEntry&gt;](OrderStatusEntry.md)
`createdAt` | Date

## Example

```typescript
import type { Order } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "items": null,
  "status": null,
  "deliveryDate": null,
  "address": null,
  "paymentMethod": null,
  "subtotal": null,
  "shipping": null,
  "discount": null,
  "pixDiscount": null,
  "total": null,
  "trackingCode": null,
  "carrier": null,
  "statusHistory": null,
  "createdAt": null,
} satisfies Order

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Order
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


