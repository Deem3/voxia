use std::collections::HashMap;
use std::sync::Mutex;
use tokio_util::sync::CancellationToken;

#[derive(Default)]
pub struct AppState {
    pub transcribe_cancel: Mutex<HashMap<String, CancellationToken>>,
}

impl AppState {
    pub fn register_transcribe(&self, task_id: String) -> CancellationToken {
        let token = CancellationToken::new();
        self.transcribe_cancel
            .lock()
            .expect("state lock")
            .insert(task_id, token.clone());
        token
    }

    pub fn take_transcribe_token(&self, task_id: &str) -> Option<CancellationToken> {
        self.transcribe_cancel
            .lock()
            .expect("state lock")
            .remove(task_id)
    }

    pub fn cancel_transcribe(&self, task_id: &str) -> bool {
        if let Some(t) = self.take_transcribe_token(task_id) {
            t.cancel();
            true
        } else {
            false
        }
    }

    pub fn finish_transcribe(&self, task_id: &str) {
        self.transcribe_cancel
            .lock()
            .expect("state lock")
            .remove(task_id);
    }
}
