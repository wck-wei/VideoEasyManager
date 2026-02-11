const uploadForm = document.getElementById("uploadForm");
const fileInput = document.getElementById("fileInput");
const uploadStatus = document.getElementById("uploadStatus");
const videoList = document.getElementById("videoList");
const refreshBtn = document.getElementById("refreshBtn");
const player = document.getElementById("player");
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
    playBtn.textContent = "播放";
    playBtn.addEventListener("click", () => {
      const encoded = encodeURIComponent(file.name);
      player.src = `/api/videos/${encoded}`;
      player.play();
      setStatus(currentVideo, `正在播放：${file.name}`);
    });

    const downloadLink = document.createElement("a");
    downloadLink.textContent = "下载";
    downloadLink.href = `/api/videos/${encodeURIComponent(file.name)}/download`;
    downloadLink.setAttribute("download", file.name);

    li.appendChild(title);
    li.appendChild(playBtn);
    li.appendChild(downloadLink);
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
    setStatus(uploadStatus, "请先选择视频文件", true);
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
