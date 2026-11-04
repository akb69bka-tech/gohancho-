import Foundation
import Capacitor
import Vision
import UIKit

/// チラシの写真の文字を、iPhone の中だけで読む（Apple Vision の VNRecognizeTextRequest。無料・オフライン・外部送信なし）。
/// - 受け取るのは JS が縮小した JPEG の base64（メモリ上だけ）。ファイルにも書かず、ネットワークも使わない。
/// - 返すのは読めた文字の行と確信度・位置だけ。品名と値段を拾うのは JS 側（gohancho/index.html の parseFlyerText）で、利用者が選んで確定する。
/// - 日本語（ja-JP）の文字認識が使えるかは iOS の版で変わる。supportedLanguages() で、その端末で使える言語を確かめられる（未確認: docs/partner_flyer_feed.md の確かめ手順）。
@objc(FlyerTextPlugin)
public class FlyerTextPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FlyerTextPlugin"
    public let jsName = "FlyerText"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "recognize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "supportedLanguages", returnType: CAPPluginReturnPromise)
    ]

    private func makeRequest(_ langs: [String]) -> VNRecognizeTextRequest {
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true
        if #available(iOS 16.0, *) {
            request.revision = VNRecognizeTextRequestRevision3
            request.automaticallyDetectsLanguage = false
        }
        // この端末で使える言語だけを渡す（使えない言語を渡すと失敗するため）
        let supported = (try? request.supportedRecognitionLanguages()) ?? []
        let use = langs.filter { supported.contains($0) }
        if !use.isEmpty { request.recognitionLanguages = use }
        return request
    }

    /// recognize({ image: <base64 JPEG>, languages?: ["ja-JP", "en-US"] }) -> { lines: [{ text, confidence, x, y, w, h }], languages: [String] }
    /// 行は上から下・左から右の順（チラシの品名の行と値段の行が並ぶように）。最大400行
    @objc func recognize(_ call: CAPPluginCall) {
        guard let b64 = call.getString("image"),
              let data = Data(base64Encoded: b64, options: .ignoreUnknownCharacters),
              let cg = UIImage(data: data)?.cgImage else {
            call.reject("bad image")
            return
        }
        let langs = (call.getArray("languages") as? [String]) ?? ["ja-JP", "en-US"]
        DispatchQueue.global(qos: .userInitiated).async {
            let request = self.makeRequest(langs)
            let handler = VNImageRequestHandler(cgImage: cg, options: [:])
            do {
                try handler.perform([request])
                let obs = (request.results ?? []).sorted {
                    let a = $0.boundingBox, b = $1.boundingBox
                    if abs(a.midY - b.midY) > 0.01 { return a.midY > b.midY }   // Vision の座標は左下が原点
                    return a.minX < b.minX
                }
                let lines: [[String: Any]] = obs.prefix(400).compactMap { o in
                    guard let top = o.topCandidates(1).first else { return nil }
                    let r = o.boundingBox
                    return ["text": top.string, "confidence": Double(top.confidence), "x": Double(r.minX), "y": Double(1 - r.maxY), "w": Double(r.width), "h": Double(r.height)]
                }
                call.resolve(["lines": lines, "languages": request.recognitionLanguages])
            } catch {
                call.reject("recognize failed")
            }
        }
    }

    /// supportedLanguages() -> { languages: [String], revision: Int }  この iOS で文字認識に使える言語（実機で ja-JP があるかを確かめるため）
    @objc func supportedLanguages(_ call: CAPPluginCall) {
        let request = makeRequest([])
        let langs = (try? request.supportedRecognitionLanguages()) ?? []
        call.resolve(["languages": langs, "revision": request.revision])
    }
}
