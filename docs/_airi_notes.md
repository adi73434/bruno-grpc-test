## Adding proto support

### Protobuf files

`.proto` files will be stored in the main connection, allowing for re-use of definitions

- [x] Add protobufjs library
- [x] Create "Definitions" component on the main Collection settings
- [x] Button to import `.proto` files
- [x] Store imported files in subfolder of the collection on disk
- - Since subfolders are rendered in bruno, it might be better to keep them in the root?
- [x] Render list of imported protobuf definitions
- [x] Button to delete proto files
- [ ] ~~Compile~~ (will load dynamically)

### Request body

Enable encoding of protobuf messages. The user input will be JSON.

- [x] Make user input JSON
- [ ] Look through proto files for `ProtoPacakge.ProtoMessage`, omitting need for user specifying proto file
- - When selecting the package/message, the file it comes from is abstracted away from the user.
- [x] Encode user's JSON to proto
- [x] Send protobuf buffer (as `application/protobuf` or `application/x-protobuf`)

Proto interface type will be selected by typing its name in the JSON, such as:

```json
{
  "ProtoPackage.ProtoMessage": {
    "field1": "val",
    "field2": "val"
  }
}
```

or

```json
{
  "proto_file.proto::ProtoPackage.ProtoMessage": {
    "field1": "val",
    "field2": "val"
  }
}
```

### Response body

- [ ] Add request body type: proto (`application/protobuf` / `application/x-protobuf`)
- [ ] Decode protobuf response based on HTTP status, as different responses could use different protobuf definitions
- [ ] UI based decoder selection (?)

- Could add a tab (_probably_ in the response pane) that maps "Proto Responses" with a JSON format as below
- This would allow easy mapping of status codes to protobuf types.

E.g.,

```json
// Response "Data Parsing" tab
// The first proto file as declared by the user (not based on digit),
// is the default for all other HTTP statuses.
// Here, ReceivedGood is the default, but if BadInput is moved up that would be the default
{
    "200": "proto_file::Package.ReceivedGood",
    "400": "proto_file::Package.BadInput",
    "403": "proto_file::Package.ForbiddenDetails"
  }
}
```

### Saving requests

- [x] This will probably need an additional entry for "proto", which will be the same as JSON input except it will also have a protobuf encoder file name
