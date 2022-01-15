import { Context, createContext } from 'react'
import VideoPromise from './VideoPromise'

const VideoContext = (createContext as Function)() as Context<VideoPromise>

export default VideoContext
