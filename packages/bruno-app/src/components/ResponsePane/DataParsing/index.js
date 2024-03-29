import React from 'react';
import StyledWrapper from './StyledWrapper';
import get from 'lodash/get';
import CodeEditor from 'components/CodeEditor';
import { useTheme } from 'providers/Theme';
import { useDispatch, useSelector } from 'react-redux';

const DataParsing = ({ bodyMode, item, collection }) => {
  const { displayedTheme } = useTheme();
  const preferences = useSelector((state) => state.app.preferences);
  const dataParsing = item.draft ? get(item, 'draft.request.dataParsing') : get(item, 'request.dataParsing');

  let codeMirrorMode = {
    proto: 'application/x-protobuf'
  };

  let dataParseContent = {
    proto: dataParsing.proto
  };

  return (
    <StyledWrapper className="w-full">
      <CodeEditor
        collection={collection}
        theme={displayedTheme}
        font={get(preferences, 'font.codeFont', 'default')}
        value={dataParseContent[bodyMode] || ''}
        mode={codeMirrorMode[bodyMode]}
      />
    </StyledWrapper>
  );
};
export default DataParsing;
