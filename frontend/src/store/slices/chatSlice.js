import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: []
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addChatMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    clearChatMessages: (state) => {
      state.messages = [];
    }
  }
});

export const { addChatMessage, clearChatMessages } = chatSlice.actions;
export default chatSlice.reducer;
