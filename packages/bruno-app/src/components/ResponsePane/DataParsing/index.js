import React from 'react';
import StyledWrapper from './StyledWrapper';
import * as Yup from 'yup';
import get from 'lodash/get';
import CodeEditor from 'components/CodeEditor';
import { useTheme } from 'providers/Theme';
import { useDispatch, useSelector } from 'react-redux';
import { saveRequest, updateResponseDataParsing } from 'providers/ReduxStore/slices/collections/index';

// const protobufStatusSelection = ["*", "100", "101", "102", "103", "200", "201", "202", "203", "204", "205", "206", "207", "208", "226", "300", "301", "302", "303", "304", "305", "306", "307", "308", "400", "401", "402", "403", "404", "405", "406", "407", "408", "409", "410", "411", "412", "413", "414", "415", "416", "417", "418", "421", "422", "423", "424", "425", "426", "428", "429", "431", "451", "500", "501", "502", "503", "504", "505", "506", "507", "508", "510", "511"];
//
// const regexProtoIdentifier = /^[A-Za-z]{1,}\.[A-Za-z]{1,}\.[A-Za-z]{1,}$/;
//
// // Valid example:
// // proto: {
// //   "*": "file.package.message",
// //   200: "file.package.message",
// //   "400": "a.b.c"
// // }
// const dataParsingSchema = Yup.object({
//   proto: Yup.object().test({
//     // name: Yup.mixed().oneOf(httpStatusCodes),
//     name: "asdfasdfasdf",
//     test(obj, ctx) {
//       // Not required
//       if (!obj) {
//         return true;
//       }
//
//       const keys = Object.keys(obj);
//
//       for (let i = 0; i !== keys.length; i++) {
//         const key = keys[i];
//         if (!protobufStatusSelection.includes(key.toString())) {
//           return ctx.createError({ message: "Invalid status selected" });
//         }
//         if (!regexProtoIdentifier.test(obj[key])) {
//           return ctx.createError({ message: "Invalid protobuf identifier format" });
//         }
//       }
//
//       return true;
//     }
//   })
// })

const DataParsing = ({ bodyMode, item, collection }) => {
  const dispatch = useDispatch();
  const { displayedTheme } = useTheme();
  const preferences = useSelector((state) => state.app.preferences);
  const parsingMode = item.draft ? get(item, 'draft.request.dataParsing.mode') : get(item, 'request.dataParsing.mode');
  const dataParsing = item.draft ? get(item, 'draft.request.dataParsing') : get(item, 'request.dataParsing');

  const onEdit = (value) => {
    console.log('onEdit', value);
    dispatch(
      updateResponseDataParsing({
        itemUid: item.uid,
        collectionUid: collection.uid,
        dataParsingByMode: value
      })
    );
  };

  const onSave = () => dispatch(saveRequest(item.uid, collection.uid));

  let codeMirrorMode = {
    proto: 'application/x-protobuf'
  };

  let dataParsingContent = {
    proto: dataParsing.proto
  };

  if (parsingMode === 'proto') {
    return (
      <StyledWrapper className="w-full">
        <CodeEditor
          collection={collection}
          theme={displayedTheme}
          font={get(preferences, 'font.codeFont', 'default')}
          value={dataParsingContent[parsingMode] || ''}
          onEdit={onEdit}
          // onRun={onRun}
          onSave={onSave}
          mode={codeMirrorMode[parsingMode]}
        />
      </StyledWrapper>
    );
  }

  return <StyledWrapper className="w-full">No Body</StyledWrapper>;
};

export default DataParsing;
