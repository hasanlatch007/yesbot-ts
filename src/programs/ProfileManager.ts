import Discord, { Snowflake, TextChannel, GuildMember, Message, MessageEmbed } from 'discord.js';
import Tools from '../common/tools';
import { MODERATOR_ROLE_NAME } from '../const';

interface DiscordGroup {
    name: String,
    members: String[]
}



export default async function ProfileManager(pMessage: Discord.Message, commandIndex: number) {
    
    const { content } = pMessage

    if (content.startsWith("!profile")) {

        const words = Tools.stringToWords(content)
        words.shift();
        const [requestedProfileUser] = words

        if (!requestedProfileUser) {
            pMessage.reply(`Incorrect syntax, please use the following: \`!profile <@219502124709445633`);
            return;
        }
        
        const requestedUser = pMessage.mentions.users.first()
        const requestedMember = pMessage.guild.members.find(m => m.user === requestedUser)

        if(!requestedMember) {
            pMessage.reply("I couldn't find that member in this server!");
            return;
        }
        const profileEmbed = await getProfileEmbed(requestedMember, pMessage);
        pMessage.channel.send(profileEmbed)
        
    }
    
}
interface Birthday {
    id:string,
    date:string
}

const getProfileEmbed = async (member:GuildMember, message: Message): Promise<MessageEmbed> => {
    const profileEmbed = new MessageEmbed();
    const countryRole = member.roles.find(r => r.name.includes("I'm from"))
    const yesEmoji = member.guild.emojis.find(e => e.name == "yes_yf")
    const birthdays:Birthday[] = <Birthday[]><unknown>await Tools.resolveFile("birthdayMembers");
    let birthdayString = 'Unknown'
    birthdays.forEach((birthday:Birthday) => {
        if(birthday.id === member.id) {
            
            birthdayString=birthday.date
        }
    })
    if(!countryRole) {
        message.reply("That user isn't registered here!")
        return null
    }
    let localUserData = await Tools.getUserData(member.user.id)
    let groupString: string = '';
    
    localUserData.groups.forEach(group => groupString = groupString+group+", ")
    groupString = groupString.substring(0, groupString.length - 2);

    const joinDate = member.joinedAt.toDateString()
    profileEmbed.setThumbnail(member.user.avatarURL())
    profileEmbed.setTitle(yesEmoji.toString() +" "+ member.user.username+"#"+member.user.discriminator)
    profileEmbed.setColor(countryRole.color)
    profileEmbed.addField("Hi! My name is:", member.displayName, true)
    profileEmbed.addField("Where I'm from:", countryRole.name, true)
    profileEmbed.addBlankField()
    profileEmbed.addField("Joined on:", joinDate, true);
    profileEmbed.addField("Birthday:", birthdayString, true);
    profileEmbed.addField("Groups:", groupString || "None", true);
    profileEmbed.setFooter("Thank you for using the Yes Theory Fam Discord Server!")
    return profileEmbed;
}