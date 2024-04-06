## Adding proto support

This adds a simple option to send (encode) and receive (decode) serialised Google Protobuf messages.

The library in use is [protobufjs](https://www.npmjs.com/package/protobufjs), see [LICENSE](https://github.com/protobufjs/protobuf.js/blob/master/LICENSE). I am not a lawyer but I don't think it poses any issues.

### Protobuf files

Import Protobuf files in the "Proto Files" tab in the collection.

`.proto` files are only stored per-collection, not per-request, allowing for re-use of definitions.

These can be manually added and deleted outside of the UI.

### Request body

To send a protobuf message, select the `Proto` body type, and use the following format for the request,
wherein the `proto_file.ProtoPackage.ProtoMessage` identifies the protobuf schema/message type to use.

The children of the protobuf identifier key, here `field1` and `field2`, are what is sent to the server

```json
{
  "proto_file.ProtoPackage.ProtoMessage": {
    "field1": "val",
    "field2": "val"
  }
}
```

### Response body

There's currently no official IANA spec for protobuf Content-Type: https://www.iana.org/assignments/media-types/media-types.xhtml

- People can potentially get creative with this, e.g., with `application/foo+protobuf`, wherein foo could represent the file.
- We are defaulting to sending with `application/x-protobuf`
- We are trying to parse the response body as protobuf if the server returned `Content-Type` of:
- - `application/vnd.google.protobuf`
- - `application/x-protobuf`
- - `application/protobuf

As such, the current behaviour is a best-effort approach, which has some compromises, such as not automatically fetching a `.proto` file off of a URL that the server might give in a header.

The Protobuf decoder will be used if either:

- The server sent a matching `Content-Type`; or
- The user's current "Data Parsing" selection is `Proto`

In any case, when using the protobuf decoder, this is the priority in which the schema is selected:

- User-defined data parsing for the exact status code
- User-defined data parsing for `*` (any status, wildcard)
- - If the user defines a wildcard, the server-defined header is never used.
- Server-defined `header["proto"]` with format `file.package.message`

This allows the user fine-grained selection of decoder schemas based on status codes, regardless of what the server says.

If the assumed `file.package.message` schema is not imported into Bruno, an error will be thrown.

If the assumed `file.package.message` schema is invalid for the server response body, we throw an error and do not try any fallbacks -- the user should know they have a mismatch.

Example "Data Parsing" inputs for `Proto` option

```json
// Responses with status codes other than 200, 400, and 403, will used the server "proto"
// header, if it's defined, else they will throw an error.
{
    "200": "proto_file.Package.ReceivedGood",
    "400": "proto_file.Package.BadInput",
    "403": "proto_file.Package.ForbiddenDetails"
}

// All responses other than status code 200 will use the BadInput schema
{
    "200": "proto_file.Package.ReceivedGood",
    "*": "proto_file.Package.BadInput",
}
```
