## Adding GRPC/proto support

### Protobuf files

`.proto` files will be stored in the main connection, allowing for re-use of definitions

- [ ] Add protobufjs library
- [x] Create "Definitions" component on the main Collection settings
- [x] Button to import `.proto` files
- [x] Store imported files in subfolder of the collection on disk
- [x] Render list of imported protobuf definitions
- [x] Button to delete proto files
- [ ] ~~Compile~~ (will load dynamically)

### Request body

Enable encoding of protobuf messages. The user input will be JSON.

- [x] Make user input JSON
- [ ] Look through proto files for `ProtoPacakge.ProtoMessage`.
- - When selecting the package/message, the file it comes from is abstracted away from the user.
- [ ] Encode user's JSON to proto

Proto interface type will be selected by typing its name in the JSON, such as:

```json
{
  "ProtoPackage.ProtoMessage": {
    "field1": "val",
    "field2": "val"
  }
}
```

### Response body

- [ ] Add request body type: proto (`application/proto`)
- [ ] Figure out where/how to design a proto message selector to decode response
- - Different types of response can come per request, e.g. on error or whatever.

It _might_ make sense to define the possible response message types in the _reqest_ body, depending on if the request body can easily be accessed in the response pane.

- This would allow easy mapping of status codes to protobuf types.
- Alternatively, could add a tab (in reuest or _probably_ response pane) that maps "Proto Responses" with the same JSON format as below

E.g.,

```json
{
  "send.ProtoPackage.ProtoMessage": {
    "field1": "val",
    "field2": "val"
  },
  "receive": {
    "200": "Package.ReceivedGood",
    "400": "Package.BadInput",
    "403": "Package.ForbiddenDetails"
  }
}
```

Saving requests

- [x] This will probably need an additional entry for "proto", which will be the same as JSON input except it will also have a protobuf encoder file name
