import 'github-markdown-css/github-markdown.css';
import { useFormik } from 'formik';
import toast from 'react-hot-toast';
import * as Yup from 'yup';
import StyledWrapper from './StyledWrapper';
import { useState } from 'react';
import { useEffect } from 'react';

const ProtoFiles = ({ collection }) => {
  const [existingProtos, setExistingProtos] = useState(['asdf']);
  const { ipcRenderer } = window;

  const listExistingProtoFiles = async () => {
    const files = await ipcRenderer.invoke('renderer:show-proto-files-collection', collection.pathname);
    console.log('listExistingProtoFiles', files);
    setExistingProtos(files);
  };

  useEffect(() => {
    listExistingProtoFiles();
  }, []);

  const removeExistingProtoFile = async (fileName) => {
    ipcRenderer.invoke('renderer:remove-single-proto-file-collection', collection.pathname, fileName).catch(() => {
      toast.error('Failed to remove Proto File!');
    });

    listExistingProtoFiles();
  };

  const copyAppProtoFiles = (filePaths) => {
    console.log('copyAppProtoFiles', filePaths);
    ipcRenderer
      .invoke('renderer:copy-add-proto-files-collection', collection.pathname, filePaths)
      .then(() => toast.success('Proto Files added successfully'))
      .catch((err) => {
        toast.error('Failed to add Proto Files!');
        // console.error(err);
        // reject(err);
      });

    listExistingProtoFiles();
  };

  const formik = useFormik({
    initialValues: {
      protoFiles: []
    },
    validationSchema: Yup.object({
      protoFiles: Yup.array()
    }),
    onSubmit: (values) => {
      copyAppProtoFiles(values.protoFiles);
    }
  });

  const getFiles = async (e) => {
    const newFiles = [];
    for (let i = 0; i !== e.files.length; ++i) {
      const file = await e.files.item(i);
      newFiles.push({ name: file.name, path: file.path });
    }
    formik.values[e.name] = newFiles;
  };

  return (
    <StyledWrapper className="mt-1 h-full w-full relative">
      {existingProtos.map((file, idx) => {
        return (
          <div key={idx}>
            <button
              className="btn-add-header text-link pr-2 py-0 mt-0 select-none"
              onClick={() => removeExistingProtoFile(file)}
            >
              Remove -
            </button>
            <span>{file}</span>
          </div>
        );
      })}
      <h1 className="font-semibold mt-8 mb-2">Add protobuf files</h1>
      <form className="bruno-form" onSubmit={formik.handleSubmit}>
        {/* TODO: Style */}
        <div className="mb-3 flex items-center">
          <label className="settings-label" htmlFor="protoFiles">
            Proto Files
          </label>
          <input
            id="protoFiles"
            type="file"
            // accept=".proto"
            name="protoFiles"
            className="block"
            onChange={(e) => getFiles(e.target)}
            multiple
          />
          {formik.touched.protoFiles && formik.errors.protoFiles ? (
            <div className="ml-1 text-red-500">{formik.errors.protoFiles}</div>
          ) : null}
        </div>

        <div className="mt-6">
          <button type="submit" className="submit btn btn-sm btn-secondary">
            Add
          </button>
        </div>
      </form>
    </StyledWrapper>
  );
};

export default ProtoFiles;
