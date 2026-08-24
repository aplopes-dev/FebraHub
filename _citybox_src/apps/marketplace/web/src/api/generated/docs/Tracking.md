
# Tracking


## Properties

Name | Type
------------ | -------------
`orderId` | string
`trackingCode` | string
`carrier` | string
`carrierUrl` | string
`currentStatus` | [OrderStatus](OrderStatus.md)
`estimatedDelivery` | Date
`timeline` | [Array&lt;TrackingTimelineInner&gt;](TrackingTimelineInner.md)
`mapPlaceholderUrl` | string

## Example

```typescript
import type { Tracking } from '@citybox/api-client'

// TODO: Update the object below with actual values
const example = {
  "orderId": null,
  "trackingCode": null,
  "carrier": null,
  "carrierUrl": null,
  "currentStatus": null,
  "estimatedDelivery": null,
  "timeline": null,
  "mapPlaceholderUrl": null,
} satisfies Tracking

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Tracking
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


