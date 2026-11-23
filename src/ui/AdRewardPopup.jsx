import Modal from './Modal.jsx';
import { Bulb, Coin, Icon } from './icons.jsx';
import { useT } from '../i18n.js';
import { claimAdReward } from '../services/ads.js';
import { sfx } from '../audio.js';

export default function AdRewardPopup({ reward }) {
  const t = useT();
  if (!reward) return null;
  if (reward.kind === 'loading') return <div className="ad-reward-layer" aria-hidden="true" />;

  const title = t('adRewardTitle');
  const prizes = {
    coins: { icon: <Coin size={38} />, label: t('adRewardCoins', { n: t.n(reward.amount) }) },
    hint: { icon: <Bulb size={38} />, label: t('adRewardHint') },
    spin: { icon: <Icon name="repeat" />, label: t('adRewardSpin') },
  };
  const prize = prizes[reward.kind];
  return (
    <div className="ad-reward-layer" role="dialog" aria-modal="true" aria-label={title}>
      <Modal pose="cheer" title={title}>
        {(leave) => (
          <>
            <p className="reward-line big">{prize.icon} {prize.label}</p>
            <div className="modal-actions">
              <button type="button" className="btn big green" autoFocus onClick={() => {
                sfx.click();
                leave(() => claimAdReward(reward));
              }}>
                {t('claimReward')}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
