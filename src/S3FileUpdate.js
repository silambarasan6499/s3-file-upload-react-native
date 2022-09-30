import * as AWS from 'aws-sdk';
import { decode } from 'base64-arraybuffer';
import RNFetchBlob from 'rn-fetch-blob';
import uuid from 'react-native-uuid';
import Config from './config';

export const UploadMediaFile = async (
  files,
  onSuccess,
  onProgress,
  onFailed,
) => {
  // Define S3 Client
  const S3Client = new AWS.S3({
    accessKeyId: Config.AWS_ACCESS_KEY,
    secretAccessKey: Config.AWS_ACCESS_SECRET,
    bucket: Config.AWS_BUCKET_NAME,
    signatureVersion: 'v4',
    region: 'ap-south-1',
  });

  // Define Params For Each Files
  let params = [];

  // Define bucket for track each files upload
  const filesBucket = new Map();

  // Make Unique Upload Key
  const keValue = (id) =>
    `upload_${id.split('-').pop().split('.').slice(0, -1).join('.')}`;

  /**
   * prepare s3 file params for each files
   */
  params = files.map(async (file) => {
    const filename = `file_${Date.now()}.${file.path.split('.').pop()}`;
    const contentType = file.mime;
    const contentDeposition = `inline;filename="${filename}"`;
    const uniqueName = uuid.v4();
    const keyName = `${uniqueName}.${filename.split('.').pop()}`;
    const base64 = await RNFetchBlob.fs.readFile(file.path, 'base64', 50000000);

    const arrayBuffer = decode(base64);

    filesBucket.set(keValue(keyName), {
      key: keValue(keyName),
      progress: 0,
      response: {},
      isUploadComplete: false,
    });

    return {
      Body: arrayBuffer,
      ContentType: contentType,
      ContentDisposition: contentDeposition,
      Key: keyName,
      Bucket: Config.AWS_BUCKET_NAME,
      SuccessActionStatus: 201,
    };
  });

  // will execute once all prep has done
  Promise.all(params).then(function (results) {
    results.map(async (param) => {
      S3Client.upload(param, (err, data) => {
        if (err) {
          // console.log('aws_error', err);
          onFailed({
            success: false,
            status: 'failed',
            response: {},
            error: err,
          });
        }
        if (data) {
          // console.log('aws_upload', data);
          // Check All Items Upload Is Completed
          filesBucket.set(keValue(param.Key), {
            success: true,
            key: keValue(param.Key),
            progress: 100,
            response: data,
            isUploadComplete: true,
          });

          const inCompleteTask = new Map(
            [...filesBucket].filter(([k, v]) => v.isUploadComplete === false),
          );

          // All items are uploaded
          if (inCompleteTask.size === 0) {
            let fileLocations = [];
            filesBucket.forEach(function (value, key) {
              fileLocations.push(value.response.Location);
            });
            onSuccess({ filesBucket, fileLocations });
          }
        }
      }).on('httpUploadProgress', (event) => {
        const currentProgress = Math.round((event.loaded / event.total) * 100);
        // console.log('aws_upload_progress', progress);
        filesBucket.set(keValue(param.Key), {
          key: keValue(param.Key),
          progress: currentProgress,
          response: {},
          isUploadComplete: false,
        });

        let totalProgress = 0;
        filesBucket.forEach(function (value, key) {
          totalProgress += value.progress;
        });
        onProgress((totalProgress / filesBucket.size).toFixed(0));
      });
    });
  });
};
