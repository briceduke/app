'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Layout } from '~/components/Layout';

// import { editProfileInput, editProfileSchema } from '~/server/api/routers/user';
// import { api } from '~/utils/api';
import { zodResolver } from '@hookform/resolvers/zod';

const SettingsPage = () => {
  const { register, handleSubmit } = useForm({
    // resolver: zodResolver(editProfileSchema),
  });
  const [avatar, setAvatar] = useState<File | null>(null);

  // const ctx = api.useContext();

  // const { mutate } = api.user.editProfile.useMutation({
  //   onSuccess: () => {
  //     ctx.user.getProfile.invalidate();
  //   }
  // });

  const handleFormSubmit = ({ email, name, password, username }: any) => {
    // Handle form submission
    // mutate({
    //   email,
    //   name,
    //   password,
    //   username
    // });
  };

  const handleAvatarDrop = (files: FileList | undefined) => {
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      setAvatar(null);
      //   setAvatar(fileList[0]);
    } else {
      setAvatar(null);
    }
  };


  return (
    <Layout title='settings'>
      <div className="bg-white text-black py-8 px-4 sm:px-6 lg:px-8">

        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-black font-prompt">Account Settings:</h2><br></br>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="mb-6">
              <label htmlFor="username" className="block font-medium mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded"
                {...register('username')}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="email" className="block font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded"
                {...register('email')}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded"
                {...register('password')}
              />
            </div>

            <h2 className="text-2xl font-semibold text-black font-prompt">Profile Settings:</h2><br></br>
            <div className="mb-6">
              <label htmlFor="displayName" className="block font-medium mb-1">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded"
                {...register('displayName')}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="avatar" className="block font-medium mb-1">
                Avatar
              </label>
              <div className="flex items-center justify-center h-40 border border-gray-300 rounded">
                <input
                  id="avatar"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleAvatarDrop(e.target.files as FileList)}
                />
                {avatar ? (
                  <img
                    src={URL.createObjectURL(avatar)}
                    alt="Avatar Preview"
                    className="h-full object-cover"
                  />
                ) : (
                  <div className="cursor-pointer">
                    Drag and drop an image or click to upload
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-gray-700 hover:bg-gray-900 text-white font-semibold rounded-md mt-4"
            >
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;