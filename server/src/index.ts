import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import ytdl from 'ytdl-core';
import { chain, forEach } from 'lodash';
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'child_process';
import sanitize from 'sanitize-filename';
import { Readable, Writable } from 'stream';

const app: Application = express();
const port: Number = 3050;

app.use(express.json());
app.use(cors());

const getRes = (formats: ytdl.videoFormat[]) => {
    const resMap: Map<number, number> = new Map(); // Use a Map to ensure uniqueness
    formats.forEach(format => {
      if (format.qualityLabel && format.height && !resMap.has(format.height)) {
        resMap.set(format.height, format.itag);
      }
    });
  
    // Convert Map to an array of objects with itag and height
    const resArr = Array.from(resMap).map(([height, itag]) => ({ itag, height }));
    
    return resArr;
  };
  
  // Endpoint to fetch video details
  app.get('/api/get-video-details/:videoId', async (req: Request, res: Response) => {
    const { videoId } = req.params;
  
    try {
      // Get video info from YouTube
      const info = await ytdl.getInfo(videoId);
      const { formats, videoDetails } = info;
      const { title, thumbnails } = videoDetails;
  
      // Get unique resolutions (heights) with their corresponding itags
      const videoResolutions = getRes(formats);
  
      res.status(200).json({
        videoInfo: {
          title,
          thumbnail: thumbnails[thumbnails.length - 1].url, // Using the last thumbnail as an example
          videoRes: videoResolutions,
          lastRes: videoResolutions[0] // Assuming you want the first resolution as an example
        }
      });
    } catch (error) {
      console.error('Error fetching video details:', error);
      res.status(500).json({ error: 'Failed to fetch video details' });
    }
  });


  app.get('/download', async (req: Request, res: Response) => {
    const { url, quality } = req.query;
  
    if (!url || typeof url !== 'string' || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
  
    try {
      // Get video info from YouTube
      const info = await ytdl.getInfo(url);
        
      // Find the format with the specified quality (itag)
      const format = info.formats.find(f => f.itag.toString() === quality);
  
      if (!format) {
        // If format is not found, return an error
        return res.status(400).json({ error: `No such format found for itag: ${quality}` });
      }
  
      // Set headers for the download response
      res.header('Content-Disposition', `attachment; filename="${info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4"`);
  
      // Pipe the video stream to the response
      ytdl(url, { quality: format.itag }).pipe(res);
    } catch (error) {
      console.error('Error downloading video:', error);
      res.status(500).json({ error: 'Failed to download video' });
    }
  });

// app.get('/video-download', async (req: Request, res: Response) => {
//     const { id, resu } = req.query;

//     try {
//         const videoId = id ? id.toString().split('?')[0] : undefined;
//       console.log(videoId)
//         if (!videoId) {
//             throw new Error('Video ID not found in request');
//         }
//         const { videoDetails: { title }, formats } = await ytdl.getInfo(id as string);
//         const videoFormat = chain(formats).filter(({ height, codecs }) => (
//             height !== undefined && height === parseInt(resu as string) && codecs?.startsWith('avc1')
//         )).orderBy('fps', 'desc').head().value();

//         const streams = {
//             video: ytdl(id as string, { quality: videoFormat.itag }),
//             audio: ytdl(id as string, { quality: 'highestaudio' })
//         };

//         const pipes = {
//             out: 1,
//             err: 2,
//             video: 3,
//             audio: 4
//         };

//         const ffmpegInputOptions = [
//             '-i', `pipe:${pipes.video}`,
//             '-i', `pipe:${pipes.audio}`,
//             '-map', '0:v',
//             '-map', '1:a',
//             '-c:v', 'copy',
//             '-c:a', 'libmp3lame',
//             '-crf', '27',
//             '-preset', 'veryfast',
//             '-movflags', 'frag_keyframe+empty_moov',
//             '-f', 'mp4'
//         ];

//         const ffmpegOptions = [
//             ...ffmpegInputOptions,
//             '-loglevel', 'error',
//             '-'
//         ];

//         const ffmpegProcess = spawn(
//             ffmpegPath as string,
//             ffmpegOptions,
//             {
//                 stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe']
//             }
//         );

//         const errorHandler = (err: any) => console.log(err);
//         function isWritableStream(obj: any): obj is Writable {
//             return obj && typeof obj.write === 'function' && typeof obj.end === 'function';
//         }
        
//         forEach(streams, (stream, format) => {
//             const dest = ffmpegProcess.stdio ? ffmpegProcess.stdio[pipes[format as keyof typeof pipes]] : null;
//             if (dest && isWritableStream(dest)) { // Check if dest is a writable stream
//                 stream.pipe(dest).on('error', errorHandler);
//             } else {
//                 errorHandler(new Error('Destination is not writable or undefined.'));
//             }
//         });

//         if (ffmpegProcess.stdio && ffmpegProcess.stdio[pipes.out]) {
//             ffmpegProcess.stdio[pipes.out]!.pipe(res);
//         }

//         let ffmpegLog = '';

//         if (ffmpegProcess.stdio && ffmpegProcess.stdio[pipes.err]) {
//             ffmpegProcess.stdio[pipes.err]!.on(
//                 'data',
//                 chunk => ffmpegLog += chunk.toString()
//             );
//         }

//         ffmpegProcess.on(
//             'exit',
//             (exitCode) => {
//                 if (exitCode === 1) {
//                     console.log(ffmpegLog);
//                 }
//                 res.end();
//             }
//         );

//         ffmpegProcess.on(
//             'close',
//             () => ffmpegProcess.kill()
//         );

//         const filename = `${encodeURI(sanitize(title))}.mp4`;
//         res.setHeader('Content-Type', 'video/mp4');
//         res.setHeader('Content-Disposition', `attachment; filename=${filename}; filename*=utf-8''${filename}`);
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });














app.get('/', (req: Request, res: Response) => {
    res.send("Server is running");
});

app.listen(port, () => {
    console.log(`Server is running on: ${port}`);
});


// https://youtu.be/6bvqH0t7j2Y?si=3azmw7lWsMXE_JRL