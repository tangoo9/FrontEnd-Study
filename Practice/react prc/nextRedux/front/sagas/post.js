import axios from 'axios'
// import shortid from "shortid";
import { all, call, delay, fork, put, takeLatest, throttle } from "redux-saga/effects";

import {
    ADD_COMMENT_REQUEST ,
    ADD_COMMENT_SUCCESS, 
    ADD_COMMENT_FAILURE,
    ADD_POST_REQUEST, 
    ADD_POST_SUCCESS ,
    ADD_POST_FAILURE,
    REMOVE_POST_REQUEST,
    REMOVE_POST_SUCCESS,
    REMOVE_POST_FAILURE,
    LOAD_POSTS_REQUEST,
    LOAD_POSTS_SUCCESS,
    LOAD_POSTS_FAILURE,
    // generateDummyPost, 
} from "../reducers/post";
import { ADD_POST_TO_MINE, REMOVE_POST_OF_MINE } from "../reducers/user";


function loadPostsAPI(data){
    return axios.get('/posts',data)
}

function* loadPosts(action){
    try{
        const result = yield call(loadPostsAPI, action.data)
        yield put({
            type:LOAD_POSTS_SUCCESS,
            data: result.data,
        })
    }catch(err){
        yield put({
            type:LOAD_POSTS_FAILURE,
            data:err.response.data
        })
    }
}



function addPostAPI(data){
    return axios.post('/post', {content : data},{
        withCredentials:true, //쿠키허용
    })
}

function* addPost(action){
    try{
        const result = yield call(addPostAPI, action.data)
        yield put({
            type:ADD_POST_SUCCESS,
            data: result.data,
        })
        yield put({
            type:ADD_POST_TO_MINE,
            data:result.data.id,
        })
    }catch(err){
        yield put({
            type:ADD_POST_FAILURE,
            data:err.response.data
        })
    }
}

function removePostAPI(data){
    return axios.post(`/post`,data, {
        withCredentials : true,
    })
}

function* removePost(action){
    try{
        yield delay(500)
        const id = shortid.generate();
        // const result = yield call(removePostAPI, action.data)
        yield put({
            type:REMOVE_POST_SUCCESS,
            data: action.data,
        })
        yield put({
            type:REMOVE_POST_OF_MINE,
            data: action.data
        })
    }catch(err){
        yield put({
            type:REMOVE_POST_FAILURE,
            data:err.response.data
        })
    }
}


function addCommentAPI(data){
    return axios.post(`/post/${data.postId}/comment`,data)
}

function* addComment(action){
    try{
        const result = yield call(addCommentAPI, action.data)
        yield put({
            type:ADD_COMMENT_SUCCESS,
            data:result.data,
        })
    }catch(err){
        console.error(err)
        yield put({
            type:ADD_COMMENT_FAILURE,
            data:err.response.data
        })
    }
}

function* watchLoadPosts(){
    yield throttle(2000, LOAD_POSTS_REQUEST, loadPosts)
}

function* watchAddPost(){
    yield takeLatest(ADD_POST_REQUEST, addPost)
}

function* watchRemovePost(){
    yield takeLatest(REMOVE_POST_REQUEST, removePost)
}

function* watchAddComment(){
    yield takeLatest(ADD_COMMENT_REQUEST, addComment)
}

export default function* postSaga(){
    yield all([
        fork(watchLoadPosts),
        fork(watchAddPost),
        fork(watchRemovePost),
        fork(watchAddComment),
    ])
}

