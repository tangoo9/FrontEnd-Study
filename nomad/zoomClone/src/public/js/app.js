const socket = io();

const myFace = document.querySelector('#myFace');

const muteBtn = document.querySelector("#mute")
const cameraBtn = document.querySelector("#cameraControl")
const cameraSelect = document.querySelector("#cameras")
const audioSelect = document.querySelector("#audios")

const call = document.querySelector("#call");



call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;


// 카메라 및 오디오 선택 설정
async function getDevices(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        const audios = devices.filter(device => device.kind === "audioinput");
        cameras.forEach((camera)=>{
            const option = document.createElement("option")
            option.value = camera.deviceId;
            option.innerText = camera.label;
            cameraSelect.appendChild(option)
        })
        audios.forEach((audio)=>{
            const option = document.createElement("option")
            option.value = audio.deviceId;
            option.innerText = audio.label;
            audioSelect.appendChild(option)
        })
    }catch(err){
        console.log(err)
    }
}

// async function getCameras(){
//     try{
//         const devices = await navigator.mediaDevices.enumerateDevices();
//         console.log(devices, "디바이스")
//         const cameras = devices.filter(device => device.kind === "videoinput")
//         // console.log(cameras)
//         cameras.forEach((camera)=>{
//             const option = document.createElement("option")
//             option.value = camera.deviceId;
//             option.innerText = camera.label;
//             cameraSelect.appendChild(option)
//         })
//     }catch(err){
//         console.log(err)
//     }
// }

// async function getAudios(){
//     try{
//         const devices = await navigator.mediaDevices.enumerateDevices();
//         const cameras = devices.filter(device => device.kind === "audioinput")
//         cameras.forEach((audio)=>{
//             const option = document.createElement("option")
//             option.value = audio.deviceId;
//             option.innerText = audio.label;
//             audioSelect.appendChild(option)
//         })
//     }catch(err){
//         console.log(err)
//     }
// }

// Stream 가져오기
async function getMedia(deviceId) {
    const initialConstrains = {
        audio: true,
        video: { facingMode: "user" },
    };
    const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initialConstrains
        );
        // console.log(myStream)
        myFace.srcObject = myStream;
        if(!deviceId){
            await getDevices();
        }
        /* 스트림 사용 */
    } catch(err) {
        /* 오류 처리 */
    }   
}


// 음소거 및 카메라 조작버튼
function handleMuteClick(){
    muted = !muted
    myStream
    .getAudioTracks()
    .forEach((track)=>(track.enabled = !track.enabled));
    if(!muted){
        muteBtn.innerText ="음소거"
    }else{
        muteBtn.innerText ="음소거 해제"
    }
}
function handleCameraClick(){
    cameraOff = !cameraOff
    myStream
        .getVideoTracks()
        .forEach((track)=>(track.enabled = !track.enabled));
    if(!cameraOff){
        cameraBtn.innerText ="카메라 끄기"
    }else{
        cameraBtn.innerText ="카메라 켜기"
    }
}

async function handleCameraChange() {
    await getMedia(cameraSelect.value);
    if (myPeerConnection) {
        // console.log(myPeerConnection.getSenders())

        // Sender : 
        // Peea A가 Peer B에 보내는 비디오&오디오 데이터를 컨트롤하는 부분
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()
            .find((sender) => sender.track.kind === "video");
        // console.log(videoSender)
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick)
cameraBtn.addEventListener("click", handleCameraClick)
cameraSelect.addEventListener("input", handleCameraChange);

// room 입장 && call getUserMedia API
const welcome = document.querySelector("#welcome");
const welcomeForm = welcome.querySelector("form")

async function initCall(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(e){
    e.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall()
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value=""
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit)

//socket Code

// Peer A에서 실행되는 코드
socket.on("welcome", async()=>{
    // console.log("누군가가 방에 입장했습니다!")
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    // console.log(offer)

    // 어떤방이 이 offer를 emit할건지 socket서버로 보내주기
    console.log("sent the offer")
    socket.emit("offer", offer, roomName)
})

// Peer B에서 실행되는 코드
socket.on("offer", async(offer) =>{
    // console.log(offer)
    console.log("recieved the offer")
    myPeerConnection.setRemoteDescription(offer)
    const answer = await myPeerConnection.createAnswer();
    // console.log(answer)
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer")
})

socket.on("answer", answer =>{
    console.log("recieved the answer")
    myPeerConnection.setRemoteDescription(answer);
})

socket.on("ice", ice =>{
    console.log("recieved candidate")
    myPeerConnection.addIceCandidate(ice)
})

//RTC Code
function makeConnection(){
    myPeerConnection = new RTCPeerConnection({
        // google에서 제공하는 STUN server, 테스트 용도로만 사용하고, 실제 production? 하고 싶다면 고유 STUN server가 필요함.
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ],
            },
        ],
    });
    myPeerConnection.addEventListener("icecandidate", handleIce)
    // console.log(myStream.getTracks())
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream
        .getTracks()
        .forEach(track=> myPeerConnection.addTrack(track, myStream));
}

function handleIce(data){
    // console.log("got ice candidate")
    // console.log(data)
    console.log("sent candidate")
    socket.emit("ice", data.candidate, roomName)
}

function handleAddStream(data){
    // console.log("got an event from my peer")
    // console.log(data)
    // console.log("Peer's Stream", data.stream);
    // console.log("My Stream", myStream)
    const peersFace = document.querySelector("#peersFace");
    peersFace.srcObject = data.stream;
}