import React, { CSSProperties, useMemo } from 'react'
import './AskForm.scss'

type AskFormItem = {
  type: 'text' | 'number' | 'password' | 'description'
  title?: string
  description?: string
  name: string
  defaultValue?: any
}

type FormError = {
  name: string
  message: string
}

type SubmitForm = {
  datas: Record<string, any>
  emitError: (name: string, message: string) => void
}

type AskFormProps = {
  items: AskFormItem[]
  /** 對應不同風格樣式和配色 */
  theme?: 'default' | 'landbank' | 'deltaww'
  submitText?: string
  loading?: boolean
  onSubmit?: (data: SubmitForm) => void
  noSubmit?: boolean // 是否不顯示送出按鈕
  children?: React.ReactNode // 新增 children 支援
}

const inputTypes = new Set(['text', 'number', 'password'] as const)

const AskForm: React.FC<AskFormProps> = (props) => {
  const { items, theme = 'default', onSubmit = () => { }, submitText = '送出', children } = props
  const noSubmit = props.noSubmit || false
  const [errors, setErrors] = React.useState<FormError[]>([])
  const clearErrors = () => {
    setErrors([])
  }
  const addErrors = (name: string, message: string) => {
    setErrors((prevErrors) => {
      const existingError = prevErrors.find((error) => error.name === name)
      if (existingError) {
        return prevErrors.map((error) =>
          error.name === name ? { ...error, message } : error
        )
      } else {
        return [...prevErrors, { name, message }]
      }
    })
  }
  const errorMap = useMemo(() => {
    const map: Record<string, string> = {}
    errors.forEach((error) => {
      map[error.name] = error.message
    })
    return map
  }, [errors])
  const classNames = useMemo(() => {
    return ['ask-form', `ask-form--${theme}`]
  }, [theme])

  const btnSubmit = () => {
    clearErrors()
    const formData: Record<string, any> = {}

    items.forEach((item) => {
      const { name } = item
      const inputElement = document.querySelector(`.ask-form__input#${name}`) as HTMLInputElement
      if (inputElement) {
        formData[name] = inputElement.value || ''
      }
    })

    onSubmit({ datas: formData, emitError: addErrors })
  }

  return (
    <div className={classNames.join(' ')}>
      {items.map((item, index) => {
        const { type, name, title = name, description = '' } = item

        if (inputTypes.has(type as any)) {
          return (
            <div
              className="ask-form__item"
              key={index}
            >
              <label htmlFor={name} className="ask-form__label">{title}</label>
              <input
                type={type}
                id={name}
                name={name}
                className="ask-form__input"
                defaultValue={item.defaultValue || ''}
              />
              {description && <div className="ask-form__description">{description}</div>}
              {errorMap[name] && <div className="ask-form__error">{errorMap[name]}</div>}
            </div>
          )
        } else if (type === 'description') {
          return (
            <div className="ask-form__item" key={index}>
              <div className="ask-form__description">{description}</div>
            </div>
          )
        } else {
          return <div key={index}></div>
        }
      })}
      {children}
      <div className="ask-form__submit">
        {props.loading && <div className="ask-form__loading"></div>}
        {!props.loading && !noSubmit &&
          <button type="button" className="ask-form__submit-button" onClick={btnSubmit}>
            {submitText}
          </button>
        }
      </div>
    </div>
  )
}

export default AskForm