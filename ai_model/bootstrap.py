from __future__ import annotations

import os
from pathlib import Path

from config import DATA_DIR, MODELS_DIR, RISK_MODEL_PATH, LOSS_MODEL_PATH, FRAUD_MODEL_PATH


def _exists_all_models() -> bool:
    return RISK_MODEL_PATH.exists() and LOSS_MODEL_PATH.exists() and FRAUD_MODEL_PATH.exists()


def _exists_all_data() -> bool:
    return (DATA_DIR / "env_data.csv").exists() and (DATA_DIR / "claims_data.csv").exists()


def ensure_ready(auto_generate: bool = True, auto_train: bool = True) -> None:
    """
    Ensures synthetic data + trained models exist.
    By default, it will generate/train if missing.
    """
    MODELS_DIR.mkdir(exist_ok=True)
    DATA_DIR.mkdir(exist_ok=True)

    if auto_generate and not _exists_all_data():
        from data_simulation import simulate_environment, simulate_claims

        df_env = simulate_environment()
        df_env.to_csv(DATA_DIR / "env_data.csv", index=False)
        df_claims = simulate_claims(df_env)
        df_claims.to_csv(DATA_DIR / "claims_data.csv", index=False)

    if auto_train and not _exists_all_models():
        try:
            import train_models
            train_models.main()
        except Exception as e:
            import traceback
            print("Training failed (run python train_models.py manually):", e)
            traceback.print_exc()


if __name__ == "__main__":
    # Allow turning off auto behavior if you want strict CI-like checks.
    auto_generate = os.environ.get("AUTO_GENERATE_DATA", "1") != "0"
    auto_train = os.environ.get("AUTO_TRAIN_MODELS", "1") != "0"
    ensure_ready(auto_generate=auto_generate, auto_train=auto_train)
    print("Bootstrap complete.")

