const Yup = require('yup');
const { uidSchema } = require('../common');

const environmentVariablesSchema = Yup.object({
  uid: uidSchema,
  name: Yup.string().nullable(),
  value: Yup.string().nullable(),
  type: Yup.string().oneOf(['text']).required('type is required'),
  enabled: Yup.boolean().defined(),
  secret: Yup.boolean()
})
  .noUnknown(true)
  .strict();

const environmentSchema = Yup.object({
  uid: uidSchema,
  name: Yup.string().min(1).required('name is required'),
  variables: Yup.array().of(environmentVariablesSchema).required('variables are required')
})
  .noUnknown(true)
  .strict();

const environmentsSchema = Yup.array().of(environmentSchema);

const keyValueSchema = Yup.object({
  uid: uidSchema,
  name: Yup.string().nullable(),
  value: Yup.string().nullable(),
  description: Yup.string().nullable(),
  enabled: Yup.boolean()
})
  .noUnknown(true)
  .strict();

const varsSchema = Yup.object({
  uid: uidSchema,
  name: Yup.string().nullable(),
  value: Yup.string().nullable(),
  description: Yup.string().nullable(),
  enabled: Yup.boolean(),

  // todo
  // anoop(4 feb 2023) - nobody uses this, and it needs to be removed
  local: Yup.boolean()
})
  .noUnknown(true)
  .strict();

const requestUrlSchema = Yup.string().min(0).defined();
const requestMethodSchema = Yup.string()
  .oneOf(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'])
  .required('method is required');

const graphqlBodySchema = Yup.object({
  query: Yup.string().nullable(),
  variables: Yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const multipartFormSchema = Yup.object({
  uid: uidSchema,
  type: Yup.string().oneOf(['file', 'text']).required('type is required'),
  name: Yup.string().nullable(),
  value: Yup.mixed().when('type', {
    is: 'file',
    then: Yup.array().of(Yup.string().nullable()).nullable(),
    otherwise: Yup.string().nullable()
  }),
  description: Yup.string().nullable(),
  enabled: Yup.boolean()
})
  .noUnknown(true)
  .strict();

const requestBodySchema = Yup.object({
  mode: Yup.string()
    .oneOf(['none', 'json', 'proto', 'text', 'xml', 'formUrlEncoded', 'multipartForm', 'graphql', 'sparql'])
    .required('mode is required'),
  json: Yup.string().nullable(),
  proto: Yup.string().nullable(),
  text: Yup.string().nullable(),
  xml: Yup.string().nullable(),
  sparql: Yup.string().nullable(),
  formUrlEncoded: Yup.array().of(keyValueSchema).nullable(),
  multipartForm: Yup.array().of(multipartFormSchema).nullable(),
  graphql: graphqlBodySchema.nullable()
})
  .noUnknown(true)
  .strict();

// "*" and HTTP status codes
const protobufStatusSelection = [
  '*',
  '100',
  '101',
  '102',
  '103',
  '200',
  '201',
  '202',
  '203',
  '204',
  '205',
  '206',
  '207',
  '208',
  '226',
  '300',
  '301',
  '302',
  '303',
  '304',
  '305',
  '306',
  '307',
  '308',
  '400',
  '401',
  '402',
  '403',
  '404',
  '405',
  '406',
  '407',
  '408',
  '409',
  '410',
  '411',
  '412',
  '413',
  '414',
  '415',
  '416',
  '417',
  '418',
  '421',
  '422',
  '423',
  '424',
  '425',
  '426',
  '428',
  '429',
  '431',
  '451',
  '500',
  '501',
  '502',
  '503',
  '504',
  '505',
  '506',
  '507',
  '508',
  '510',
  '511'
];

// Match `a.b.c`, where a/b/c must be at least 1 char
const regexProtoIdentifier = /^[A-Za-z]{1,}\.[A-Za-z]{1,}\.[A-Za-z]{1,}$/;

// Valid example:
// proto: {
//   "*": "file.package.message",
//   200: "file.package.message",
//   "400": "a.b.c"
// }
const dataParsingSchema = Yup.object({
  proto: Yup.object().test({
    // name: Yup.mixed().oneOf(httpStatusCodes),
    name: 'asdfasdfasdf',
    test(obj, ctx) {
      // Not required
      if (!obj) {
        return true;
      }

      const keys = Object.keys(obj);

      for (let i = 0; i !== keys.length; i++) {
        const key = keys[i];
        if (!protobufStatusSelection.includes(key.toString())) {
          return ctx.createError({ message: 'Invalid status selected' });
        }
        if (!regexProtoIdentifier.test(obj[key])) {
          return ctx.createError({ message: 'Invalid protobuf identifier format' });
        }
      }

      return true;
    }
  })
})
  .notRequired()
  .strict();

// const dataParsingSchema = Yup.object({
//   // proto: Yup.array().of(dataParsingProtoSchema)
//   proto: Yup.string()
// })
// .strict()

const authAwsV4Schema = Yup.object({
  accessKeyId: Yup.string().nullable(),
  secretAccessKey: Yup.string().nullable(),
  sessionToken: Yup.string().nullable(),
  service: Yup.string().nullable(),
  region: Yup.string().nullable(),
  profileName: Yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const authBasicSchema = Yup.object({
  username: Yup.string().nullable(),
  password: Yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const authBearerSchema = Yup.object({
  token: Yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const authDigestSchema = Yup.object({
  username: Yup.string().nullable(),
  password: Yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const oauth2Schema = Yup.object({
  grantType: Yup.string()
    .oneOf(['client_credentials', 'password', 'authorization_code'])
    .required('grantType is required'),
  username: Yup.string().when('grantType', {
    is: (val) => ['client_credentials', 'password'].includes(val),
    then: Yup.string().nullable(),
    otherwise: Yup.string().nullable().strip()
  }),
  password: Yup.string().when('grantType', {
    is: (val) => ['client_credentials', 'password'].includes(val),
    then: Yup.string().nullable(),
    otherwise: Yup.string().nullable().strip()
  }),
  callbackUrl: Yup.string().when('grantType', {
    is: (val) => ['authorization_code'].includes(val),
    then: Yup.string().nullable(),
    otherwise: Yup.string().nullable().strip()
  }),
  authorizationUrl: Yup.string().when('grantType', {
    is: (val) => ['authorization_code'].includes(val),
    then: Yup.string().nullable(),
    otherwise: Yup.string().nullable().strip()
  }),
  accessTokenUrl: Yup.string().when('grantType', {
    is: (val) => ['client_credentials', 'password', 'authorization_code'].includes(val),
    then: Yup.string().nullable(),
    otherwise: Yup.string().nullable().strip()
  }),
  clientId: Yup.string().when('grantType', {
    is: (val) => ['authorization_code', 'client_credentials'].includes(val),
    then: Yup.string().nullable(),
    otherwise: Yup.string().nullable().strip()
  }),
  clientSecret: Yup.string().when('grantType', {
    is: (val) => ['authorization_code', 'client_credentials'].includes(val),
    then: Yup.string().nullable(),
    otherwise: Yup.string().nullable().strip()
  }),
  scope: Yup.string().when('grantType', {
    is: (val) => ['client_credentials', 'password', 'authorization_code'].includes(val),
    then: Yup.string().nullable(),
    otherwise: Yup.string().nullable().strip()
  }),
  pkce: Yup.boolean().when('grantType', {
    is: (val) => ['authorization_code'].includes(val),
    then: Yup.boolean().defined(),
    otherwise: Yup.boolean()
  })
})
  .noUnknown(true)
  .strict();

const authSchema = Yup.object({
  mode: Yup.string()
    .oneOf(['inherit', 'none', 'awsv4', 'basic', 'bearer', 'digest', 'oauth2'])
    .required('mode is required'),
  awsv4: authAwsV4Schema.nullable(),
  basic: authBasicSchema.nullable(),
  bearer: authBearerSchema.nullable(),
  digest: authDigestSchema.nullable(),
  oauth2: oauth2Schema.nullable()
})
  .noUnknown(true)
  .strict();

// Right now, the request schema is very tightly coupled with http request
// As we introduce more request types in the future, we will improve the definition to support
// schema structure based on other request type
const requestSchema = Yup.object({
  url: requestUrlSchema,
  method: requestMethodSchema,
  headers: Yup.array().of(keyValueSchema).required('headers are required'),
  params: Yup.array().of(keyValueSchema).required('params are required'),
  auth: authSchema,
  body: requestBodySchema,
  // dataParsing: dataParsingSchema,
  dataParsing: Yup.object({
    mode: Yup.string().oneOf(['none', 'proto']),
    proto: Yup.string().notRequired()
  }),
  script: Yup.object({
    req: Yup.string().nullable(),
    res: Yup.string().nullable()
  })
    .noUnknown(true)
    .strict(),
  vars: Yup.object({
    req: Yup.array().of(varsSchema).nullable(),
    res: Yup.array().of(varsSchema).nullable()
  })
    .noUnknown(true)
    .strict()
    .nullable(),
  assertions: Yup.array().of(keyValueSchema).nullable(),
  tests: Yup.string().nullable(),
  docs: Yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const itemSchema = Yup.object({
  uid: uidSchema,
  type: Yup.string().oneOf(['http-request', 'graphql-request', 'folder']).required('type is required'),
  seq: Yup.number().min(1),
  name: Yup.string().min(1, 'name must be at least 1 character').required('name is required'),
  request: requestSchema.when('type', {
    is: (type) => ['http-request', 'graphql-request'].includes(type),
    then: (schema) => schema.required('request is required when item-type is request')
  }),
  items: Yup.lazy(() => Yup.array().of(itemSchema)),
  filename: Yup.string().nullable(),
  pathname: Yup.string().nullable()
})
  .noUnknown(true)
  .strict();

const collectionSchema = Yup.object({
  version: Yup.string().oneOf(['1']).required('version is required'),
  uid: uidSchema,
  name: Yup.string().min(1, 'name must be at least 1 character').required('name is required'),
  items: Yup.array().of(itemSchema),
  activeEnvironmentUid: Yup.string()
    .length(21, 'activeEnvironmentUid must be 21 characters in length')
    .matches(/^[a-zA-Z0-9]*$/, 'uid must be alphanumeric')
    .nullable(),
  environments: environmentsSchema,
  pathname: Yup.string().nullable(),
  runnerResult: Yup.object({
    items: Yup.array()
  }),
  collectionVariables: Yup.object(),
  brunoConfig: Yup.object()
})
  .noUnknown(true)
  .strict();

module.exports = {
  requestSchema,
  itemSchema,
  environmentSchema,
  environmentsSchema,
  collectionSchema,
  dataParsingSchema
};
