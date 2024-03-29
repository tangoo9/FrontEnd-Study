import React, { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import useSWR from 'swr';

import AppLayout from '../components/AppLayout'
import NicknameEditForm from '../components/NicknameEditForm'
import FollowList from '../components/FollowList'
import { useDispatch, useSelector } from 'react-redux'
// import { LOAD_FOLLOWERS_REQUEST, LOAD_FOLLOWINGS_REQUEST } from '../reducers/user'
import wrapper from '../store/configureStore'
import { END } from 'redux-saga'
import axios from 'axios';


export const followingList = '팔로잉 목록'
export const followerList = '팔로워 목록'

const fetcher = (url) => axios.get(url, {withCredentials:true}).then((result)=> result.data);


const Profile = () => {
	const dispatch = useDispatch();
	const router = useRouter();
	const {user} = useSelector((state) => state.user);
	const [followersLimit, setFollowersLimit] = useState(3);
	const [followingsLimit, setFollowingsLimit] = useState(3);


	const { data: followersData, error: followerError } = useSWR(`http://localhost:3065/user/followers?limit=${followersLimit}`, fetcher);
	const { data: followingsData, error: followingError } = useSWR(`http://localhost:3065/user/followings?limit=${followingsLimit}`, fetcher); 

	const loadMoreFollowings = useCallback(() => {
		setFollowingsLimit((prev) => prev + 3);
	}, []);

	const loadMoreFollowers = useCallback(() => {
		setFollowersLimit((prev) => prev + 3);
	}, []);


	useEffect(()=>{
		if(!(user && user.id)){
			router.push('/')
		}
	},[user && user.id])

	if (!user) {
		return '내 정보 로딩중...';
	}


// return 들어갈때 hooks 아래에 오도록 주의
	if (followerError || followingError) {
		console.error(followerError || followingError);
		return <div>팔로잉/팔로워 로딩 중 에러가 발생합니다.</div>;
	}
	


	return (
		<>
			<Head>
				<title>My Profile | Next Board</title>
			</Head>
			<AppLayout>
				<NicknameEditForm/>
				<FollowList header={followingList} data={followingsData} onClickMore = {loadMoreFollowings} 
				loading={!followingsData && !followingError}/>
				<FollowList header={followerList} data={followersData} onClickMore = {loadMoreFollowers}
				loading={!followersData && !followerError}
				/>
			</AppLayout>
		</>

	)
}

export const getServerSideProps = wrapper.getServerSideProps((store) => async ({ req }) => {
	console.log('getServerSideProps start');
	const cookie = req ? req.headers.cookie : '';
	axios.defaults.headers.Cookie = '';
	if (req && cookie) {
		axios.defaults.headers.Cookie = cookie;
	}
	store.dispatch({
		type: LOAD_MY_INFO_REQUEST,
	});
	store.dispatch(END);	
	console.log('getServerSideProps end');
	await store.sagaTask.toPromise();
});


export default Profile