import { decode } from 'base64-arraybuffer'
import AWS from 'aws-sdk'
import fs from 'react-native-fs'
import uuid from 'react-native-uuid';
import { getExtention } from './Validator'
import { accessKeyId, secretAccessKey, region, bucketName } from '../utills/Api'

export const S3FileUpdate = (file) => {
  return Promise.all(
  file.map(async (e) => {
    let type =
      Platform.OS == 'ios' ? e.name.split('.')[1] : e.type.split('/')[1]
    let name = e.name
    let uri = e.uri
    let ext = getExtention(name)
    ext = '.' + ext[0]

    let keyName =
      'posts/' + uuid.v4() + ext

    const contentType = type
    const contentDeposition = `inline;filename="${name}"`
    const fPath = uri
    const base64 = await fs.readFile(fPath, 'base64')
    const arrayBuffer = decode(base64)

    AWS.config.update({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region,
    })

    const S3Client = new AWS.S3()

    const form = new FormData()
    form.append(e)

    const params = {
      Body: arrayBuffer,
      ACL: 'public-read',
      ContentType: contentType,
      ContentDisposition: contentDeposition,
      Key: keyName,
      Bucket: bucketName,
      SuccessActionStatus: 201,
    }

    return new Promise((res, rej) => {
      S3Client.upload(params, (err, data) => {
        if (err) {
          console.log('error', err)
          rej(err)
        }
        res(data)
      }).on('httpUploadProgress', (event) => {
        console.log('----s3 progress ->', event)
      })
    })
  })
  )
}


export const S3ImageUpdate = (file) => {
  return Promise.all(
  file.map(async (e) => {
    let type =
      Platform.OS == 'ios' ? e.type.split('/')[1] : e.type.split('/')[1]
    let name = Platform.OS == 'ios' ? e.type : e.type
    let uri = e.uri
    let ext = Platform.OS == 'ios' ? e.type.split('/')[1] : e.type.split('/')[1]

    let keyName =
      'posts/' + uuid.v4()+"." + ext

    const contentType = type
    const contentDeposition = `inline;filename="${name}"`
    const fPath = uri
    const base64 = await fs.readFile(fPath, 'base64')
    const arrayBuffer = decode(base64)

    AWS.config.update({
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region,
    })

    const S3Client = new AWS.S3()

    const form = new FormData()
    form.append(e)

    const params = {
      Body: arrayBuffer,
      ACL: 'public-read',
      ContentType: contentType,
      ContentDisposition: contentDeposition,
      Key: keyName,
      Bucket: bucketName,
      SuccessActionStatus: 201,
    }

    return new Promise((res, rej) => {
      S3Client.upload(params, (err, data) => {
        if (err) {
          console.log('error', err)
          rej(err)
        }
        res(data)
      }).on('httpUploadProgress', (event) => {
        console.log('----s3 progress ->', event)
      })
    })
  })
  )
}
