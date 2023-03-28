import type { TrackType } from '../types';
import type { SigningAccount } from '../../../../types';
import type { SubmittableResult } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';

import BN from 'bn.js';
import { useEffect, useState } from 'react';
import { ChevronRightIcon, CloseIcon } from '../../../icons';
import { Modal, Button, ButtonSecondary } from '../../../lib';
import { useAppLifeCycle, extractBalance } from '../../../../lifecycle';
import { Delegate } from '../../../../lifecycle/types';
import { Accounticon } from '../../accounts/Accounticon.js';
import { Conviction } from '../../../../types';
import { SimpleAnalytics } from '../../../../analytics';
import { useAccount } from '../../../../contexts';
import { signAndSend, calcEstimatedFee } from '../../../../utils/polkadot-api';
import { formatBalance } from '@polkadot/util';

interface IDelegateModalProps {
  delegate: Delegate;
  tracks: TrackType[];
  open: boolean;
  onClose: () => void;
}

function LabeledBox({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <div className={`flex flex-col gap-1 ${className}`}>
        <div className="text-sm">{title}</div>
        <div className="flex gap-2 text-base font-medium">{children}</div>
      </div>
    </>
  );
}
export function DelegateModal({
  delegate,
  tracks,
  open,
  onClose,
}: IDelegateModalProps) {
  const { state, updater } = useAppLifeCycle();
  const { connectedAccount } = useAccount();
  const [tx, setTx] =
    useState<SubmittableExtrinsic<'promise', SubmittableResult>>();
  const [fee, setFee] = useState<BN>();
  const balance = extractBalance(state);
  const { name, address: delegateAddress } = delegate;
  const tracksCaption = tracks
    .slice(0, 2)
    .map((track) => track.title)
    .join(', ');
  const remainingCount = Math.max(tracks.length - 2, 0);

  const connectedAddress = connectedAccount?.account?.address;
  useEffect(() => {
    // reset tx
    setTx(undefined);
    setFee(undefined);
    if (
      open &&
      delegateAddress &&
      connectedAddress &&
      balance &&
      tracks.length > 0
    ) {
      // Use a default conviction voting for now
      updater
        .delegate(
          delegateAddress,
          tracks.map((track) => track.id),
          balance,
          Conviction.None
        )
        .then(async (tx) => {
          if (tx?.type === 'ok') {
            const fee = await calcEstimatedFee(tx.value, connectedAddress);
            setFee(fee);
            setTx(tx.value);
          }
        });
    }
  }, [open, balance, delegateAddress, tracks, connectedAddress]);

  const cancelHandler = () => onClose();
  const delegateHandler = async (
    { account: { address }, signer }: SigningAccount,
    delegateTx: SubmittableExtrinsic<'promise', SubmittableResult>
  ) => {
    try {
      await signAndSend(address, signer, delegateTx);
      SimpleAnalytics.track('Delegate');
    } finally {
      // close modal
      onClose();
    }
  };
  return (
    <Modal size="md" open={open} onClose={() => onClose()}>
      <div className="flex w-full flex-col gap-12 p-4 md:p-12">
        <div className="flex flex-col items-start justify-start gap-6 ">
          <div className="text-left">
            <h2 className="mb-2 text-3xl font-medium">Summary</h2>
            <p className="text-base">
              Submitting this transaction will delegate your voting power to
              <b>{name}</b> Delegate for the following tracks.
            </p>
          </div>
          <div className="grid w-full grid-cols-3 grid-rows-2 gap-4">
            <LabeledBox className="col-span-2" title="Tracks to delegate">
              <div>
                {tracksCaption}
                {remainingCount && (
                  <>
                    {' and'} <a>{`${remainingCount} more`}</a>
                  </>
                )}
              </div>
            </LabeledBox>
            <LabeledBox title="Tokens to delegate">
              <div className="text-base font-medium">{balance?.toString()}</div>
            </LabeledBox>
            <LabeledBox className="col-span-2" title="Your delegate">
              <div className="flex gap-2">
                <Accounticon
                  textClassName="font-medium"
                  address={delegateAddress}
                  size={24}
                />
                <div className="capitalize">{name}</div>
              </div>
            </LabeledBox>
            <LabeledBox title="Max Conviction">
              <div>x0.01</div>
            </LabeledBox>
          </div>
          <hr className="w-full bg-gray-400" />
          <div className="w-full">
            {fee && formatBalance(fee, { decimals: 12 })}
          </div>
        </div>
        <div className="flex w-full flex-row justify-end gap-4">
          <ButtonSecondary onClick={cancelHandler}>
            <CloseIcon />
            <div>Cancel</div>
          </ButtonSecondary>

          <Button
            onClick={() =>
              connectedAccount && tx && delegateHandler(connectedAccount, tx)
            }
            disabled={!connectedAccount || !tx}
          >
            <div>Delegate Now</div>
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
