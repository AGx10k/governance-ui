import { useMemo } from 'react';
import { Remark } from 'react-remark';
import type { DelegateRoleType, StatType } from './types';
import { ChevronRightIcon, DelegateIcon } from '../../icons';
import { Button, ButtonSecondary, Card } from '../../lib';
import { Accounticon } from '../accounts/Accounticon.js';
import { Delegate, State } from '../../../lifecycle/types';

const tag: Record<DelegateRoleType, { title: string; twColor: string }> = {
  nominator: { title: 'nominator', twColor: 'bg-green-300' },
  validator: { title: 'validator', twColor: 'bg-lime-300' },
  fellow: { title: 'fellowship', twColor: 'bg-yellow-300' },
};
export function RoleTag({ role }: { role: DelegateRoleType }) {
  if (!tag[role]) return <></>;
  const { title, twColor } = tag[role];
  return (
    <div
      className={`flex min-h-full min-w-[30px] items-start justify-start rounded-full px-2 py-1 ${twColor}`}
    >
      <p className="text-xs font-semibold uppercase">{title}</p>
    </div>
  );
}

export function CardStat({ stat }: { stat: StatType }) {
  const { title, value } = stat;
  return (
    <div className="flex flex-col items-start justify-start gap-y-1">
      <div className="leading-normal">{title}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

export function StatBar({ stats }: { stats: StatType[] }) {
  return (
    <>
      {stats.length > 0 && <hr />}
      <div className="prose prose-sm flex flex-row gap-6">
        {stats.map((stat, idx) => (
          <CardStat key={idx} stat={stat} />
        ))}
      </div>
    </>
  );
}

function extractRole(address: string, state: State): DelegateRoleType[] {
  if (state.type == 'ConnectedState') {
    if (state.chain.fellows.has(address)) {
      return ['fellow'];
    }
  }
  return [];
}

function manifestoPreview(
  str: string,
  maxLen: number
): { preview: string; truncated: boolean } {
  const preview = str.substring(0, maxLen);
  const truncated = str.length > maxLen;
  return { preview, truncated };
}

export function DelegateCard({
  delegate,
  state,
  delegateHandler,
  variant,
}: {
  delegate: Delegate;
  state: State;
  delegateHandler: () => void;
  variant: 'all' | 'some';
}) {
  const { name, address, manifesto } = delegate;
  const roles = extractRole(address, state);
  const { preview, truncated } = useMemo(
    () => manifestoPreview(manifesto, 200),
    [manifesto]
  );
  return (
    <>
      <Card
        className={`flex h-80 shrink-0 grow-0 flex-col gap-4 p-6 shadow-md ${
          variant === 'all' ? 'w-[420px]' : 'w-full'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col items-start">
            <h2 className="text-xl capitalize">{name}</h2>
            <Accounticon
              address={address}
              size={24}
              textClassName="font-semibold my-2"
            />
          </div>
          {variant === 'some' && (
            <ButtonSecondary onClick={delegateHandler}>
              <div className="flex w-full flex-nowrap items-center justify-center gap-1">
                <div>Select</div>
                <ChevronRightIcon />
              </div>
            </ButtonSecondary>
          )}
        </div>
        <div className="flex gap-2">
          {roles.map((role) => (
            <RoleTag key={role} role={role} />
          ))}
        </div>
        <div className="prose prose-sm grow overflow-auto text-ellipsis leading-tight">
          <Remark>{preview}</Remark>
          {truncated && <span className="text-primary">{'Read more ->'}</span>}
        </div>
        <StatBar stats={[]} />
        {variant === 'all' && (
          <Button onClick={delegateHandler}>
            <div>Delegate All Votes</div>
            <DelegateIcon />
          </Button>
        )}
      </Card>
    </>
  );
}
