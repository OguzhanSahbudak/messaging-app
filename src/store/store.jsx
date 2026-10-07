import { configureStore } from '@reduxjs/toolkit';
import membersReducer from './membersSlice';
import chatReducer from './chatSlice';
import notificationReducer from './notificationSlice'

export const store =configureStore({
    reducer:{
        members:membersReducer,
        chat:chatReducer,
        notification:notificationReducer
    }
})