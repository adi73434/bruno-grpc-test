const protobuf = require('protobufjs');

// For these Content-Types, the response will be assumed to be protobuf.
// - https://datatracker.ietf.org/doc/html/draft-rfernando-protocol-buffers-00
// - https://groups.google.com/g/protobuf/c/VAoJ-HtgpAI
//
// TODO: TypeScript declare as `const contentTypesProtobuf = [...] as const`
// to make read-only
const contentTypesProtobuf = ['application/vnd.google.protobuf', 'application/x-protobuf', 'application/protobuf'];

// Setting here as there's nothing official, and we may want to
// be able to quickly change this in the future.
//
// This is the Content-Type that will be used when sending.
//
// TODO: Not sure how to go about using this in `/packages/bruno-app`,
// in places where "application/x-protobuf" is hard-coded.
// Maybe this file should be in `/packages/bruno-common` ??
//
// See: https://www.iana.org/assignments/media-types/media-types.xhtml
const contentTypeDefaultProtobuf = contentTypesProtobuf[1];

/**
 * Attempts to encode request.body.proto using protobufjs.
 *
 * Assumes `request.body.proto` is defined.
 *
 * `request.body.proto` will look like this, where field1 and field2 are sent:
 * {
 *   "protobufFileWithoutExtension.protobufPackage.protobufMessage": {
 *     "field1": "val1",
 *     "field2": "val2"
 *   }
 * }
 *
 * @param {Record<string, unknown>} request From redux, see findItemInCollection()
 * @param {string} collectionPath Within which proto files are stored
 *
 * @returns {Buffer|Uint8Array} Encoded protobuf buffer
 *
 * @throws {SyntaxError} If `JSON.parse(request.body.proto)` fails
 * @throws If no protobuf schema string provided
 * @throws If protobuf schema string is not formatted as `file.package.message`
 * @throws If protobuf `file` is not imported into Bruno,
 * or if the `package.message` is not found
 */
const encodeProtobuf = (request, collectionPath) => {
  const jsonWithProtoMetadata = JSON.parse(request.body.proto);

  // "file.package.message"
  const firstFieldKey = Object.keys(jsonWithProtoMetadata)[0];

  // [file, package, message]
  const protoSchemaParts = firstFieldKey.split('.');

  if (
    protoSchemaParts.length !== 3 ||
    protoSchemaParts[0].length < 1 ||
    protoSchemaParts[1].length < 1 ||
    protoSchemaParts[2].length < 1
  ) {
    throw `[Encoding] Invalid format of protobuf identifier. Expected: "fileNameWithoutExtension.package.message", received: ${protoSchemaParts}`;
  }

  let protoRoot;
  let protoEncoder;

  try {
    // Can be async
    protoRoot = protobuf.loadSync(`${collectionPath}/proto/${protoSchemaParts[0]}.proto`);
  } catch (e) {
    throw `[Encoding] Desired protobuf file doesn't exist: ${protoSchemaParts[0]}`;
  }

  try {
    protoEncoder = protoRoot.lookupType(`${protoSchemaParts[1]}.${protoSchemaParts[2]}`);
  } catch (e) {
    throw `[Encoding] Desired protobuf package.message type doesn't exist: ${protoSchemaParts[1]}.${protoSchemaParts[2]}`;
  }

  // Everything inside of the "wrapper" (the protobuf schema descriptor)
  const protoJsonAsObject = jsonWithProtoMetadata[firstFieldKey];

  const errVerify = protoEncoder.verify(protoJsonAsObject);
  if (errVerify) {
    throw `[Encoding] Incorrect protobuf data format (fields mismatch). Error: ${errVerify}`;
  }

  return protoEncoder.encode(protoJsonAsObject).finish();
};

/**
 * Attempts to decode the dataBuffer using protobufjs.
 *
 * Protobuf schema priority:
 * - dataParsing.proto["200"] > dataParsing.proto["*"] if the status code was 200
 * - dataParsing.proto["*"]   > headers['proto']
 *
 * That is to say: user-defined status-code > user-defined default > server-defined header
 *
 * A wrongly formatted `file.package.message` entry in `dataParsing.proto` will
 * take precedence over a valid headers['proto'] so the user knows
 * their dataParsing input is invalid.
 *
 *
 *  NOTE: Instead of throwing, UX might be better by returning the following JSON,
 * though this would become inconsistent with `encodeProtobuf()`.
 * {
 *   brunoDecodeError: "user friendly error here",
 *   brunoDecodeInternalException: "exception from .loadSync() | .lookupType() | .decode()",
 *   brunoDecodeSchemaString: protoSchemaString,
 *   brunoDecodeOriginalBuffer: dataBuffer,
 * }
 * Here dataBuffer would be returned in the JSON, as the dataBuffer returned from
 * `parseDataFromResponse()` does not get shown in the UI, whereas in this case
 * the user should see it.
 *
 *
 * @todo TODO: Consider allowing the user to define the name of the header
 * where the protobuf schema will be. There is no standard and people might
 * use something other than "proto"
 *
 *
 * @param {import('axios').AxiosResponse} response
 * @param {string} collectionPath Within which proto files are stored
 * @param {Record<string, unknown>} originalRequest From redux, see findItemInCollection()
 *
 * @returns Decoded `data` JSON
 *
 * @throws If no protobuf schema string provided
 * @throws If protobuf schema string is not formatted as `file.package.message`
 * @throws If protobuf `file` is not imported into Bruno,
 * or if the `package.message` is not found
 * @throws If there's a decoding error. This comes from protobufjs `.decode()` but
 * it is re-thrown here to provide context as protobuf decoding errors can seem cryptic.
 */
const decodeProtobuf = (response, collectionPath, originalRequest, dataBuffer) => {
  // UX reasoning:
  let protoSchemaString;
  let userDefinedProto = undefined;

  // Can be undefined, hence ?
  if (response.headers['proto']?.length > 0) {
    protoSchemaString = response.headers['proto'];
  }

  // .proto might be undefined/null, and .proto[foo] might be undefined, hence ? both
  if (originalRequest.dataParsing.proto?.['*']?.length > 0) {
    userDefinedProto = 'wildcard (*)';
    protoSchemaString = originalRequest.dataParsing.proto['*'];
  }
  if (originalRequest.dataParsing.proto?.[response.status]?.length > 0) {
    userDefinedProto = `status ${response.status}`;
    protoSchemaString = originalRequest.dataParsing.proto[response.status];
  }

  // [file, package, message]
  const protoSchemaParts = protoSchemaString?.split('.');

  if (!protoSchemaParts) {
    throw `[Decoding] No protobuf identifier provided from server or by user
      .......... [[Raw data buffer]]: ${dataBuffer}`;
  }

  if (
    protoSchemaParts.length !== 3 ||
    protoSchemaParts[0].length < 1 ||
    protoSchemaParts[1].length < 1 ||
    protoSchemaParts[2].length < 1
  ) {
    if (userDefinedProto) {
      throw `[Decoding] Invalid format of user-defined protobuf identifier.
        Expected "fileNameWithoutExtension.package.message", received: ${protoSchemaParts}
        .......... [[Raw data buffer]]: ${dataBuffer}`;
    }
    throw `[Decoding] Invalid format of server-provided 'proto' header: ${protoSchemaParts}
      .......... [[Raw data buffer]]: ${dataBuffer}`;
  }

  let protoRoot;
  let protoDecoder;

  try {
    // Can be async
    protoRoot = protobuf.loadSync(`${collectionPath}/proto/${protoSchemaParts[0]}.proto`);
  } catch (e) {
    throw `[Decoding] Desired protobuf file doesn't exist: ${protoSchemaParts[0]}.proto
      .......... [[Raw data buffer]]: ${dataBuffer}`;
  }

  try {
    protoDecoder = protoRoot.lookupType(`${protoSchemaParts[1]}.${protoSchemaParts[2]}`);
  } catch (e) {
    throw `[Decoding] Desired protobuf package.message type doesn't exist: ${protoSchemaParts[1]}.${protoSchemaParts[2]}
      .......... [[Raw data buffer]]: ${dataBuffer}`;
  }

  try {
    const decodedProto = protoDecoder.decode(dataBuffer);
    return decodedProto.toJSON();
  } catch (e) {
    // Re-throwing here to provide some context to the user,
    // because an error like "RangeError: index out of range: 75 + 8 > 80"
    // isn't very friendly
    throw `[Decoding] Protobuf decoding error (maybe protobuf identifier mismatch?): ${e}
      .......... [[Raw data buffer]]: ${dataBuffer}`;
  }
};

module.exports = {
  contentTypesProtobuf,
  contentTypeDefaultProtobuf,
  encodeProtobuf,
  decodeProtobuf
};
