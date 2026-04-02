import { describe, expect, it } from 'vitest';
import { mergeTaskMembersWithCurrentUser } from '../src/tools/oapi/task/task';

describe('mergeTaskMembersWithCurrentUser', () => {
  it('adds current user as follower when members are empty', () => {
    expect(mergeTaskMembersWithCurrentUser(undefined, 'ou_owner')).toEqual([
      { id: 'ou_owner', role: 'follower' },
    ]);
  });

  it('adds current user as follower when not already present', () => {
    expect(
      mergeTaskMembersWithCurrentUser([{ id: 'ou_assignee', role: 'assignee' }], 'ou_owner'),
    ).toEqual([
      { id: 'ou_assignee', role: 'assignee' },
      { id: 'ou_owner', role: 'follower' },
    ]);
  });

  it('does not duplicate current user when already in members', () => {
    expect(
      mergeTaskMembersWithCurrentUser(
        [
          { id: 'ou_owner', role: 'assignee' },
          { id: 'ou_other', role: 'follower' },
        ],
        'ou_owner',
      ),
    ).toEqual([
      { id: 'ou_owner', role: 'assignee' },
      { id: 'ou_other', role: 'follower' },
    ]);
  });
});
