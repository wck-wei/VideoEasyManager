const uploadForm = document.getElementById("uploadForm");
const fileInput = document.getElementById("fileInput");
const uploadStatus = document.getElementById("uploadStatus");
const videoList = document.getElementById("videoList");
const refreshBtn = document.getElementById("refreshBtn");
const videoPlayer = document.getElementById("videoPlayer");
const audioPlayer = document.getElementById("audioPlayer");
const imageViewer = document.getElementById("imageViewer");
const currentVideo = document.getElementById("currentVideo");

function formatSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return "-";
  }
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let idx = 0;
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024;
    idx += 1;
  }
  return `${size.toFixed(1)} ${units[idx]}`;
}

function setStatus(element, text, isError = false) {
  element.textContent = text;
  element.classList.toggle("error", isError);
}

function getCategory(file) {
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("video/")) {
    return "video";
  }
  if (type.startsWith("audio/")) {
    return "audio";
  }
  if (type.startsWith("image/")) {
    return "image";
  }
  const ext = file.name.split(".").pop().toLowerCase();
  if (["mp4", "webm", "ogg", "mov", "mkv"].includes(ext)) {
    return "video";
  }
  if (["mp3", "wav", "aac", "flac", "m4a", "ogg"].includes(ext)) {
    return "audio";
  }
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) {
    return "image";
  }
  return "unknown";
}

function resetPlayers() {
  videoPlayer.pause();
  audioPlayer.pause();
  videoPlayer.classList.add("hidden");
  audioPlayer.classList.add("hidden");
  imageViewer.classList.add("hidden");
  videoPlayer.removeAttribute("src");
  audioPlayer.removeAttribute("src");
  imageViewer.removeAttribute("src");
}

async function fetchVideos() {
  const res = await fetch("/api/videos");
  if (!res.ok) {
    throw new Error("获取列表失败");
  }
  const data = await res.json();
  return data.files || [];
}

function renderList(files) {
  videoList.innerHTML = "";
  if (files.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "暂无视频";
    videoList.appendChild(empty);
    return;
  }
  files.forEach((file) => {
    const li = document.createElement("li");
    li.className = "video-item";

    const title = document.createElement("span");
    title.textContent = `${file.name} (${formatSize(file.size)})`;

    const playBtn = document.createElement("button");
    playBtn.textContent = "播放/查看";
    playBtn.addEventListener("click", () => {
      const encoded = encodeURIComponent(file.name);
      const category = getCategory(file);
      resetPlayers();
      if (category === "video") {
        videoPlayer.src = `/api/videos/${encoded}`;
        videoPlayer.classList.remove("hidden");
        videoPlayer.play();
      } else if (category === "audio") {
        audioPlayer.src = `/api/videos/${encoded}`;
        audioPlayer.classList.remove("hidden");
        audioPlayer.play();
      } else if (category === "image") {
        imageViewer.src = `/api/videos/${encoded}`;
        imageViewer.classList.remove("hidden");
      } else {
        setStatus(currentVideo, "不支持的媒体类型", true);
        return;
      }
      setStatus(currentVideo, `当前媒体：${file.name}`);
    });

    const downloadLink = document.createElement("a");
    downloadLink.textContent = "下载";
    downloadLink.href = `/api/videos/${encodeURIComponent(file.name)}/download`;
    downloadLink.setAttribute("download", file.name);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "删除";
    deleteBtn.addEventListener("click", async () => {
      const confirmed = window.confirm(`确定删除 ${file.name} 吗？`);
      if (!confirmed) {
        return;
      }
      try {
        const res = await fetch(`/api/videos/${encodeURIComponent(file.name)}`, {
          method: "DELETE"
        });
        if (!res.ok) {
          throw new Error("删除失败");
        }
        if (currentVideo.textContent.includes(file.name)) {
          resetPlayers();
          setStatus(currentVideo, "");
        }
        await refreshList();
      } catch (err) {
        setStatus(uploadStatus, err.message || "删除失败", true);
      }
    });

    li.appendChild(title);
    li.appendChild(playBtn);
    li.appendChild(downloadLink);
    li.appendChild(deleteBtn);
    videoList.appendChild(li);
  });
}

async function refreshList() {
  try {
    const files = await fetchVideos();
    renderList(files);
  } catch (err) {
    setStatus(uploadStatus, err.message || "获取列表失败", true);
  }
}

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = fileInput.files[0];
  if (!file) {
    setStatus(uploadStatus, "请先选择媒体文件", true);
    return;
  }
  const formData = new FormData();
  formData.append("file", file);
  setStatus(uploadStatus, "上传中...");
  try {
    const res = await fetch("/api/videos", {
      method: "POST",
      body: formData
    });
    if (!res.ok) {
      throw new Error("上传失败");
    }
    const data = await res.json();
    setStatus(uploadStatus, `上传成功：${data.name}`);
    fileInput.value = "";
    await refreshList();
  } catch (err) {
    setStatus(uploadStatus, err.message || "上传失败", true);
  }
});

refreshBtn.addEventListener("click", refreshList);

refreshList();
