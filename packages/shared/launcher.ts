/// <reference lib="deno.ns" />
/**
 * 오케스트레이터 서버(4_content-system)가 8004 포트에서 실행 중인지 확인하고,
 * 꺼져 있다면 백그라운드에서 자동으로 기동합니다.
 */
export async function ensureServerRunning() {
    const PORT = 8004;

    try {
        // 8004 포트로 연결 시도하여 서버 가동 여부 확인
        // @ts-ignore: Deno
        const conn = await Deno.connect({ hostname: "127.0.0.1", port: PORT });
        conn.close();
        // console.log("✅ 오케스트레이터 서버가 이미 실행 중입니다.");
    } catch (err) {
        // @ts-ignore: Deno
        if (err instanceof Deno.errors.ConnectionRefused) {
            console.log("⚠️ 오케스트레이터 서버가 꺼져 있습니다. 자동 기동을 시작합니다...");

            // 서버를 백그라운드에서 실행
            // 절대 경로를 사용하여 어떤 작업 디렉토리에서도 실행 가능하도록 함
            const command = new Deno.Command("deno", {
                args: [
                    "run",
                    "-A",
                    "C:/linkdrop-workspace/agents/4_content-system/4_index.ts",
                    "--server"
                ],
                stdout: "null",
                stderr: "null",
            });

            // 프로세스를 백그라운드에서 실행
            // spawn()은 프로세스를 시작하고 제어권을 즉시 반환함
            command.spawn();

            // 서버가 포트를 점유할 시간을 주기 위해 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log("🚀 오케스트레이터 서버가 백그라운드에서 기동되었습니다.");
        } else {
            console.error("❌ 서버 상태 확인 중 오류 발생:", err);
        }
    }
}
