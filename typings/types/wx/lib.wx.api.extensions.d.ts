declare namespace WechatMiniprogram {
    interface PrivacySettingResult {
        errMsg: string
        needAuthorization: boolean
        privacyContractName?: string
    }

    interface GetPrivacySettingOption {
        complete?: (result: PrivacySettingResult) => void
        fail?: (result: GeneralCallbackResult) => void
        success?: (result: PrivacySettingResult) => void
    }

    interface OpenPrivacyContractOption {
        complete?: (result: GeneralCallbackResult) => void
        fail?: (result: GeneralCallbackResult) => void
        success?: (result: GeneralCallbackResult) => void
    }

    interface ExitMiniProgramOption {
        complete?: (result: GeneralCallbackResult) => void
        fail?: (result: GeneralCallbackResult) => void
        success?: (result: GeneralCallbackResult) => void
    }

    interface Wx {
        exitMiniProgram(option?: ExitMiniProgramOption): void
        getPrivacySetting(option: GetPrivacySettingOption): void
        openPrivacyContract(option?: OpenPrivacyContractOption): void
    }
}