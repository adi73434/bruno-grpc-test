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

There's currently no official IANA spec for protobuf Content-Type: https://www.iana.org/assignments/media-types/media-types.xhtml

- People can potentially get creative with this, e.g., with `application/foo+protobuf`, wherein foo could represent the file.

Inferring response type options:

- Rely only on request Content-Type: `application/vnd.google.protobuf`, `application/x-protobuf`, `application/protobuf`
- - Error or fallback to text if no `dataParsing` provided
- - Error or fallback to text if server lied to us
- Rely only on `dataParsing` being set
- - Error or fallback if user lied to us
- (NOT DOING) Rely first on request Content-Type _and_ a `proto=com.example.SomeMessage` header, then `dataParsing`
- - Error or fallback to dataParsing if server lied to us
- - - Error or fallback to text if user lied to us
- (NOT DOING) Rely first on `dataParsing` then `proto=com.example.SomeMessage` header
- - Error or fallback to `proto=` header if user lied to us
- - - Error or fallback to text if server lied to us

My preference is for the user to have a diktat on how to parse the data, regardless of what the server says.

- [ ] Decode protobuf response based on HTTP status, as different responses could use different protobuf definitions
- [ ] UI based decoder selection (?)

- Could add a tab (_probably_ in the response pane) that maps "Proto Responses" with a JSON format as below
- This would allow easy mapping of status codes to protobuf types.

E.g.,

```json
// Response "Data Parsing" tab
//
// - Could use the first defined protobuf (in order of definition, not numerical)
// as the default for all non-defined status codes (here it would be ReceivedGood)
// - Could require "*" field key, which acts as the fallback/default for non-defined
// status codes
{
    "200": "proto_file::Package.ReceivedGood",
    "400": "proto_file::Package.BadInput",
    "403": "proto_file::Package.ForbiddenDetails"
  }
}
```

### Saving requests

- [x] This will probably need an additional entry for "proto", which will be the same as JSON input except it will also have a protobuf encoder file name
