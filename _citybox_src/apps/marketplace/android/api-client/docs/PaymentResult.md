
# PaymentResult

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **type** | [**PaymentType**](PaymentType.md) |  |  [optional] |
| **status** | [**inline**](#Status) |  |  [optional] |
| **paymentMethodId** | **kotlin.String** |  |  [optional] |
| **displayName** | **kotlin.String** |  |  [optional] |
| **authorizationCode** | **kotlin.String** |  |  [optional] |
| **pixQrCodeBase64** | **kotlin.String** |  |  [optional] |
| **pixCopyPaste** | **kotlin.String** |  |  [optional] |
| **barcode** | **kotlin.String** |  |  [optional] |
| **digitableLine** | **kotlin.String** |  |  [optional] |
| **dueDate** | [**java.time.LocalDate**](java.time.LocalDate.md) |  |  [optional] |
| **pdfUrl** | [**java.net.URI**](java.net.URI.md) |  |  [optional] |
| **expiresAt** | [**java.time.OffsetDateTime**](java.time.OffsetDateTime.md) |  |  [optional] |


<a id="Status"></a>
## Enum: status
| Name | Value |
| ---- | ----- |
| status | PENDING, APPROVED, DECLINED |



