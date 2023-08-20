import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '~/utils/api.util';
import { handleErrors } from '~/utils/handle-errors.util';
import { formatAvatar } from '~/utils/image-src-format.util';

import {
    Camera, DiscordLogo, GithubLogo, Hammer, Heart, InstagramLogo, LinkSimple, PencilSimple,
    SealCheck, ShareFat, TiktokLogo, TwitterLogo, YoutubeLogo
} from '@phosphor-icons/react';
import { LinkType } from '@prisma/client';
import { inferRouterOutputs } from '@trpc/server';

import { Button } from './Button';
import { DeleteModal } from './DeleteModal';
import { ProfileMenu } from './Menus/ProfileMenu';
import { ReportModal } from './ReportModal';

import type { AppRouter } from '~/server/api/root';
import type { User } from 'next-auth';
type RouterOutput = inferRouterOutputs<AppRouter>;

interface Props {
    profileData?: RouterOutput['user']['getProfile'];
    username: string;
    isCurrentUser: boolean;
    currentUser: User | null;
    authStatus: ReturnType<typeof useSession>['status'];
    loading: boolean;
}

export const ProfileCard = ({ profileData, username, isCurrentUser, currentUser, authStatus, loading }: Props) => {
    const { asPath, push } = useRouter();
    const ctx = api.useContext();

    const [likeAnimation, setLikeAnimation] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);

    const { mutate: deleteUser } = api.admin.deleteUser.useMutation({
        onSuccess: () => toast.success('User deleted successfully!'),
        onError: (e) => handleErrors({ e, message: 'An error occurred while deleting this user.' })
    });

    const handleDeleteUser = () => {
        if (!profileData?.id) {
            toast.error('An error occurred while deleting this user.');
            return;
        }

        setConfirmDeleteModalOpen(true);
    }

    const { mutate, isLoading } = api.user.likeProfile.useMutation({
        onMutate: async () => {
            await ctx.user.getProfile.cancel({ username });

            const previousProfileData = ctx.user.getProfile.getData({ username });

            if (!previousProfileData) return;

            ctx.user.getProfile.setData({ username }, {
                ...previousProfileData,
                authUserHasLiked: !previousProfileData.authUserHasLiked,
                likeCount: previousProfileData.likeCount + (previousProfileData.authUserHasLiked ? -1 : 1)
            });

            return previousProfileData;
        },
        onSettled: () => {
            ctx.user.getProfile.invalidate({ username });
        },
        onError: (e) => handleErrors({
            e, message: "Could not like!", fn: () => {
                if (!profileData) return;
                ctx.user.getProfile.setData({ username }, { ...profileData, authUserHasLiked: !profileData.authUserHasLiked })
            }
        }),
    })

    const origin =
        typeof window !== 'undefined' && window.location.origin
            ? window.location.origin
            : '';

    const userUrl = `${origin}${asPath}`;

    const handleShare = () => {
        navigator.clipboard.writeText(userUrl);

        toast.success('Copied profile link to clipboard!');
    }

    return (
        <div className="h-full flex flex-col justify-center font-inter">
            {reportModalOpen && <ReportModal isOpen={reportModalOpen} setIsOpen={setReportModalOpen} type='USER' id={profileData?.id} />}
            {confirmDeleteModalOpen && <DeleteModal isOpen={confirmDeleteModalOpen} setIsOpen={setConfirmDeleteModalOpen} admin deleteFn={() => {
                deleteUser({ id: profileData?.id ?? '' });
                push('/explore');
            }} />}
            <div className='md:w-96 w-full flex flex-col gap-4'>
                <div className='flex md:flex-col gap-4 md:justify-normal'>
                    <div className={`w-32 h-32 basis-32 grow-0 shrink-0 md:basis-auto md:w-72 md:h-72 xl:w-96 xl:h-96 relative ${loading && ' skeleton'}`}>
                        <Image priority src={formatAvatar(profileData?.image, profileData?.id)} alt={profileData?.username ?? ''} fill className='rounded-full object-contain' />
                    </div>

                    <div className='flex flex-col gap-1 md:gap-4'>
                        <h1 className='font-black text-2xl md:text-4xl font-urbanist gap-2 md:gap-3 flex items-center'>
                            <span>{profileData?.username}</span>
                            {profileData?.admin ? <Hammer className='w-6 h-6 md:w-8 md:h-8' /> : profileData?.verified && <SealCheck className='w-6 h-6 md:w-8 md:h-8' />}
                        </h1>

                        <p className={`grow ${loading && 'skeleton'}`}>{profileData?.tagline}</p>

                        <div className='flex gap-4 text-sm md:text-base'>
                            <p className={`flex items-center gap-1`}>
                                <Camera className='w-5 h-5' />
                                <span className={loading ? 'skeleton' : ''}>{profileData?.imageCount} Shot{profileData?.imageCount !== 1 ? 's' : ''}</span>
                            </p>

                            <p className='flex items-center gap-1'>
                                <Heart className='w-5 h-5' />
                                <span className={loading ? 'skeleton' : ''}>{profileData?.likeCount} Like{profileData?.likeCount !== 1 ? 's' : ''}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className={`flex text-sm gap-2 w-96 max-w-full flex-wrap`}>
                    {profileData?.links.map(link =>
                        <Link href={`${link.url}`} key={link.id}>
                            <p className='flex items-center gap-1'>
                                {link.type === LinkType.TWITTER && <TwitterLogo className='w-5 h-5' />}
                                {link.type === LinkType.YOUTUBE && <YoutubeLogo className='w-5 h-5' />}
                                {link.type === LinkType.TIKTOK && <TiktokLogo className='w-5 h-5' />}
                                {link.type === LinkType.DISCORD && <DiscordLogo className='w-5 h-5' />}
                                {link.type === LinkType.INSTAGRAM && <InstagramLogo className='w-5 h-5' />}
                                {link.type === LinkType.GITHUB && <GithubLogo className='w-5 h-5' />}
                                {link.type === LinkType.WEBSITE && <LinkSimple className='w-5 h-5' />}
                                <span className='underline'>{link.url.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '')}</span>
                            </p>
                        </Link>)}
                </div>

                <div className='w-full flex items-center justify-between gap-4'>
                    {!isCurrentUser && <>
                        <div className='grow'>
                            <Button
                                centerItems
                                onClick={() => {
                                    if (authStatus !== 'authenticated') {
                                        push('/login');
                                        return;
                                    }

                                    setLikeAnimation(true);
                                    if (profileData?.id) mutate({ id: profileData.id });
                                }}
                                iconLeft={
                                    <Heart
                                        weight={(profileData?.authUserHasLiked) ? 'fill' : 'regular'}
                                        onAnimationEnd={() => setLikeAnimation(false)}
                                        className={likeAnimation ? 'animate-ping ' : '' + (profileData?.authUserHasLiked ? 'text-red-700' : 'text-white dark:text-black')}
                                    />
                                }
                                disabled={loading || isLoading}
                            >
                                Like{(profileData?.authUserHasLiked) ? 'd' : ''}
                            </Button>
                        </div>

                        <div>
                            {(currentUser && profileData?.id) && <ProfileMenu user={currentUser} userUrl={userUrl} handleDeleteUser={handleDeleteUser} setReportModalOpen={setReportModalOpen} />}
                        </div>
                    </>}

                    {isCurrentUser && <>
                        <Link href='/settings/profile' className='grow'>
                            <Button variant='outline' iconLeft={<PencilSimple />} centerItems>
                                Edit
                            </Button>
                        </Link>

                        <div className='grow'>
                            <Button variant='outline' iconLeft={<ShareFat />} centerItems onClick={handleShare}>
                                Share
                            </Button>
                        </div>
                    </>}
                </div>
            </div>
        </div>
    )
}