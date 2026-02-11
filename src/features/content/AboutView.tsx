import tsIcon from '../../icons/icons8-typescript.svg'
import cIcon from '../../icons/c-dark-logo.svg'
import pythonIcon from '../../icons/python-127-svgrepo-com.svg'
import cssIcon from '../../icons/css3-02-svgrepo-com.svg'
import reactIcon from '../../icons/react-svgrepo-com.svg'

const ToolItem = ({ icon, name }: { icon: any, name: string }) => {
    const isUrl = typeof icon === 'string'
    const IconComponent = icon

    return (
        <div className="flex flex-col items-center justify-center p-2 sm:p-3 bg-gruv-bg-soft rounded-lg group hover:bg-gruv-bg transition-colors h-full w-20 sm:w-auto">
            {isUrl ? (
                <img src={icon} alt={name} className="w-6 h-6 mb-2 object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
            ) : (
                <IconComponent className="w-6 h-6 mb-2 text-gruv-fg/60 group-hover:text-gruv-blue" />
            )}
            <span className="text-[10px] sm:text-xs text-gruv-fg/40 group-hover:text-gruv-fg text-center break-words w-full">{name}</span>
        </div>
    )
}

export function AboutView() {
    return (
        <div className="flex flex-col h-full overflow-y-auto space-y-8 justify-center p-4">

            {/* Bio Section */}
            <section>
                <h2 className="text-xl text-gruv-yellow font-bold mb-4">./profile</h2>
                <p className="text-gruv-fg/80 leading-relaxed text-lg">
                    I'm a student interested in <span className="text-gruv-orange font-bold">graph theory</span> and <span className="text-gruv-orange font-bold">competitive programming</span>.
                    I'm now shifting focus from solving code challenges to understanding <span className="text-gruv-yellow font-bold">low-level</span> and <span className="text-gruv-yellow font-bold">web technologies</span>.
                </p>
            </section>

            <div className="grid grid-cols-1 gap-8">


                {/* Stack */}
                <section>
                    <h3 className="text-sm text-gruv-fg/60 mb-4 font-bold">// my stack </h3>
                    <div className="flex flex-wrap justify-center sm:grid sm:grid-cols-5 gap-2">
                        <ToolItem icon={tsIcon} name="TypeScript" />
                        <ToolItem icon={cIcon} name="C" />
                        <ToolItem icon={pythonIcon} name="Python" />
                        <ToolItem icon={cssIcon} name="CSS" />
                        <ToolItem icon={reactIcon} name="React" />
                    </div>
                </section>
            </div>

        </div>
    )
}
