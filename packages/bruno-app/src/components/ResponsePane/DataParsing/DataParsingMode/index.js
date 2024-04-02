import React, { useRef, forwardRef } from 'react';
import get from 'lodash/get';
import { IconCaretDown } from '@tabler/icons';
import Dropdown from 'components/Dropdown';
import { useDispatch } from 'react-redux';
import StyledWrapper from './StyledWrapper';
import { updateRequestBodyMode, updateResponseDataParsingMode } from 'providers/ReduxStore/slices/collections/index';
import { humanizeResponseDataParsingMode } from 'utils/collections/index';

const DataParsingMode = ({ item, collection }) => {
  const dispatch = useDispatch();
  const dropdownTippyRef = useRef();
  const onDropdownCreate = (ref) => (dropdownTippyRef.current = ref);
  const dataParsing = item.draft ? get(item, 'draft.request.dataParsing') : get(item, 'request.dataParsing');
  const dataParsingMode = dataParsing?.mode;

  const Icon = forwardRef((props, ref) => {
    return (
      <div ref={ref} className="flex items-center justify-center pl-3 py-1 select-none selected-body-mode">
        {humanizeResponseDataParsingMode(dataParsingMode)}{' '}
        <IconCaretDown className="caret ml-2 mr-2" size={14} strokeWidth={2} />
      </div>
    );
  });

  const onModeChange = (value) => {
    dispatch(
      updateResponseDataParsingMode({
        itemUid: item.uid,
        collectionUid: collection.uid,
        mode: value
      })
    );
  };

  return (
    <StyledWrapper>
      <div className="inline-flex items-center cursor-pointer body-mode-selector">
        <Dropdown onCreate={onDropdownCreate} icon={<Icon />} placement="bottom-end">
          <div className="label-item font-medium cursor-default">Binary</div>
          <div
            className="dropdown-item"
            onClick={() => {
              dropdownTippyRef.current.hide();
              onModeChange('proto');
            }}
          >
            Proto
          </div>
          <div className="label-item font-medium cursor-default">None</div>
          <div
            className="dropdown-item"
            onClick={() => {
              dropdownTippyRef.current.hide();
              onModeChange('none');
            }}
          >
            None
          </div>
        </Dropdown>
      </div>
    </StyledWrapper>
  );
};
export default DataParsingMode;
