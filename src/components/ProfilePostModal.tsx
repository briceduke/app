import { useSession } from 'next-auth/react';
import { Inter, Urbanist } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { Dispatch, Fragment, SetStateAction, useState } from 'react';
import { toast } from 'react-hot-toast';
import { api, RouterOutputs } from '~/utils/api.util';
import { handleErrors } from '~/utils/handle-errors.util';
import { formatAvatar, formatImage } from '~/utils/image-src-format.util';

import { Dialog, Menu, Transition } from '@headlessui/react';
import { DotsThree, Flag, Hammer, Prohibit, SealCheck, ShareFat, X } from '@phosphor-icons/react';

import { Button } from './Button';
import { DeleteModal } from './DeleteModal';
import {
    getPostTypeIconSmall, onError, onMutate, onSettled
} from './PostSection/post-section.util';
import { ReportModal } from './ReportModal';

export type ProfilePost = RouterOutputs['post']['getPostsAllTypes'][0];

interface ProfilePostModalProps {
    post: ProfilePost | null;
    user: RouterOutputs['user']['getProfile'] | null;
    setPostModalOpen: Dispatch<SetStateAction<boolean>>;
}

const urbanist = Urbanist({
    subsets: ['latin-ext'],
    display: 'swap',
    variable: '--font-urbanist',
});

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const ProfilePostModal = ({ post, user, setPostModalOpen }: ProfilePostModalProps) => {
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
    const [confirmDeleteUserModalOpen, setConfirmDeleteUserModalOpen] = useState(false);

    const { data } = useSession();
    const { asPath, push, query } = useRouter();
    const ctx = api.useContext();

    const { mutate } = api.admin.deletePost.useMutation({
        onSuccess: () => {
            toast.success('Post deleted successfully!');
            ctx.post.getLatestPosts.invalidate();
            ctx.post.getPostsAllTypes.invalidate();
            closeModal();
        },
        onError: (e) => handleErrors({ e, message: 'An error occurred while deleting this post.' })
    });

    /**
     * This deletes the post
     * The image gets removed from the s3 bucket in the backend
     * onMutate, onError, and onSettled are custom functions in ./post-section.util.ts that handle optimistic updates
     */
    const { mutate: deletePost } = api.post.deletePost.useMutation({
        onSuccess: () => {
            toast.success('Post deleted successfully!');
            ctx.post.getLatestPosts.invalidate();
            ctx.post.getPostsAllTypes.invalidate();
            closeModal();
        },
        onError: (e) => handleErrors({ e, message: 'An error occurred while deleting this post.' })
    });

    const userIsProfileOwner = data?.user.id === user?.id;

    const handleDeletePost = () => {
        if (!post?.id) {
            toast.error('An error occurred while deleting this post.');
            return;
        }

        setConfirmDeleteModalOpen(true);
    }

    const handleDeleteUserPost = () => {
        if (!post?.id) {
            toast.error('An error occurred while deleting this post.');
            return;
        }

        setConfirmDeleteUserModalOpen(true);
    }

    const closeModal = () => {
        push(asPath.split('?')[0] ?? '/');
    }

    const handleShare = () => {
        const origin =
            typeof window !== 'undefined' && window.location.origin
                ? window.location.origin
                : '';

        const url = `${origin}${asPath}`;

        navigator.clipboard.writeText(url);

        toast.success('Copied post link to clipboard!');
    }

    if (!post || !user) return null;

    return <Transition appear show={true} as={Fragment}>
        <Dialog as="div" className={`relative z-10 ${urbanist.variable} ${inter.variable} font-urbanist`} onClose={closeModal}>
            <Transition.Child
                as={Fragment}
                enter="ease-out duration-100"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            {reportModalOpen && <ReportModal isOpen={reportModalOpen} setIsOpen={setReportModalOpen} type='POST' id={query.postId?.toString()} />}
            {confirmDeleteModalOpen && <DeleteModal isOpen={confirmDeleteModalOpen} setIsOpen={setConfirmDeleteModalOpen} admin post deleteFn={() => {
                mutate({ id: query.postId?.toString() ?? '' });
                push('/explore');
            }} />}
            {confirmDeleteUserModalOpen && <DeleteModal isOpen={confirmDeleteUserModalOpen} setIsOpen={setConfirmDeleteUserModalOpen} post deleteFn={() => {
                deletePost({ id: query.postId?.toString() ?? '' });
            }} />}

            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center text-center gap-12">

                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-100"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-100"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className={`relative transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-xl transition-all w-[400px] h-[654px]`}>
                            <Image src={formatImage(post.image, user?.id)} alt={post.type ?? ''} fill className='rounded-xl border-black border object-cover' />
                            <button className='absolute left-4 top-4 text-white' onClick={closeModal}>
                                <X className='w-5 h-4' />
                            </button>

                            <div className='flex flex-col justify-end items-center p-4 absolute bottom-0 bg-gradient-to-b from-transparent to-black w-full h-1/4 bg-fixed'>
                                <div className='text-white flex w-full gap-2 mb-2 pl-0.5'>
                                    {getPostTypeIconSmall(post.type)}
                                    <h1 className='font-urbanist'>{post.type.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</h1>
                                </div>

                                <div className='flex justify-between items-center w-full'>
                                    <Link href={`/${user?.username}`} className='flex gap-2'>
                                        <Image className='rounded-full object-cover' src={formatAvatar(user?.image, user?.id)} alt={user?.username ?? ""} width={30} height={30} />

                                        <h1 className='text-white flex gap-1 items-center text-sm w-full'>
                                            <span className='truncate'>{user?.username}</span>
                                            {user?.admin ? <Hammer className='w-4 h-4' /> : user?.verified && <SealCheck className='w-4 h-4' />}
                                        </h1>
                                    </Link>

                                    <Menu as="div" className="relative inline-block text-left">
                                        <Menu.Button className='text-white flex items-center justify-center rounded-lg w-12 h-8 hover:bg-white hover:bg-opacity-10 transition-colors duration-100'>
                                            <DotsThree className='w-5 h-5' />
                                        </Menu.Button>
                                        <Transition
                                            as={Fragment}
                                            enter="transition ease-out duration-100"
                                            enterFrom="transform opacity-0 scale-95"
                                            enterTo="transform opacity-100 scale-100"
                                            leave="transition ease-in duration-75"
                                            leaveFrom="transform opacity-100 scale-100"
                                            leaveTo="transform opacity-0 scale-95"
                                        >
                                            <Menu.Items className="absolute z-50 right-0 bottom-0 rounded-md w-44 origin-top-right border border-black dark:border-white bg-white dark:bg-black">
                                                <div className="px-1 py-1 space-y-1">
                                                    <Menu.Item>
                                                        <Button variant='ghost' iconRight={<ShareFat />} onClick={handleShare}>
                                                            <p>Share</p>
                                                        </Button>
                                                    </Menu.Item>
                                                    {data?.user && <Menu.Item>
                                                        <Button variant={'ghost'} iconRight={<Flag />} onClick={() => setReportModalOpen(true)}>
                                                            <p>Report</p>
                                                        </Button>
                                                    </Menu.Item>}
                                                    {userIsProfileOwner && <Menu.Item>
                                                        <Button variant={'ghost'} iconRight={<Prohibit />} onClick={handleDeleteUserPost}>
                                                            <p>Delete</p>
                                                        </Button>
                                                    </Menu.Item>}
                                                    {data?.user.admin && <Menu.Item>
                                                        <Button variant={'ghost'} iconRight={<Hammer />} onClick={handleDeletePost}>
                                                            <p>Delete</p>
                                                        </Button>
                                                    </Menu.Item>}
                                                </div>
                                            </Menu.Items>
                                        </Transition>
                                    </Menu>
                                </div>
                            </div>
                        </Dialog.Panel>

                    </Transition.Child>
                </div>
            </div>
        </Dialog>
    </Transition>
}