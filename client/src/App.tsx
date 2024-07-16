import React, { useState } from "react";
import "./App.css";
import axios from "axios";

interface VideoInfo {
  lastRes: number;
  thumbnail: string;
  title: string;
  videoRes: videoRes[];
}
interface videoRes {
  itag: number;
  height: number;
}

function App() {
  const [getLink, setGetLink] = useState<string>("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [videoRes, setVideoRes] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);

  const getVideoInfo = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();

    const videoId = getLink.split("https://youtu.be/")[1];

    try {
      setLoading(true);
      const { data } = await axios.get(
        `http://localhost:3050/api/get-video-details/${videoId}`
      );
      setLoading(false);

      setVideoInfo(data.videoInfo);
      setVideoRes(data.videoInfo.lastRes);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (videoInfo && videoRes) {
      window.location.href = `http://localhost:3050/download?url=${encodeURIComponent(
        getLink
      )}&quality=${videoRes}`;
    } else {
      alert("select quality");
    }
  };

 
  return (
    <div className="App">
      <h2>Youtube Video Downloader</h2>
      <div className="search_bar">
        <input
          type="text"
          placeholder="please enter your youtube url..."
          onChange={(e) => setGetLink(e.target.value)}
          value={getLink}
        />
        <button onClick={getVideoInfo} type="submit">
          Click
        </button>
      </div>
      {loading ? (
        <div>
          <p>Loading</p>
        </div>
      ) : (
        videoInfo && (
          <div className="video-info">
            <div className="thumbnail">
              <img src={videoInfo.thumbnail} alt="Thumbnail" />
            </div>
            <div className="details">
              <p className="title">{videoInfo.title}</p>
              <div className="controls">
                <select onChange={(e) => setVideoRes(e.target.value)} value={videoInfo.lastRes}>
                 
                  {videoInfo.videoRes.map((format, index) => (
                    <option key={index} value={format.itag}>
                      {format.height}p - {format.itag}
                    </option>
                  ))}
                </select>
                <button onClick={handleDownload} className="download-button">
                  Download
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default App;
